import type { Task, TaskView, Tema } from '../../types';
import type { LoadedState, Preferencias, StorageProvider } from '../StorageProvider';
import { getSupabaseClient } from '../supabaseClient';

interface TasksRow {
  id: string;
  usuario_id: string;
  posicao: number;
  titulo: string;
  descricao: string;
  prioridade: Task['prioridade'];
  prazo: string | null;
  status: Task['status'];
  favorita: boolean;
  categoria: string | null;
  projeto: string | null;
  tags: string[];
  lembrete: string | null;
  lembrete_notificado: boolean;
  recorrencia: Task['recorrencia'];
  retorno_em: string | null;
  subtarefas: Task['subtarefas'];
  anotacoes: Task['anotacoes'];
  historico: Task['historico'];
  criada_em: string;
  atualizada_em: string | null;
  concluida_em: string | null;
}

interface PreferenciasRow {
  usuario_id: string;
  tema: Tema;
  view: TaskView;
  kpi_collapsed: boolean;
  atualizada_em: string;
}

/** Converte uma `Task` do app na linha (snake_case) da tabela `tasks`. */
export function paraLinha(task: Task, usuarioId: string, posicao: number): TasksRow {
  return {
    id: task.id,
    usuario_id: usuarioId,
    posicao,
    titulo: task.titulo,
    descricao: task.descricao,
    prioridade: task.prioridade,
    prazo: task.prazo,
    status: task.status,
    favorita: task.favorita ?? false,
    categoria: task.categoria ?? null,
    projeto: task.projeto ?? null,
    tags: task.tags ?? [],
    lembrete: task.lembrete ?? null,
    lembrete_notificado: task.lembreteNotificado ?? false,
    recorrencia: task.recorrencia ?? null,
    retorno_em: task.retornoEm ?? null,
    subtarefas: task.subtarefas ?? [],
    anotacoes: task.anotacoes ?? [],
    historico: task.historico,
    criada_em: task.criadaEm,
    atualizada_em: task.atualizadaEm ?? null,
    concluida_em: task.concluidaEm ?? null,
  };
}

/** Converte uma linha da tabela `tasks` na `Task` do app (camelCase). */
export function paraTarefa(row: TasksRow): Task {
  return {
    id: row.id,
    titulo: row.titulo,
    descricao: row.descricao,
    prioridade: row.prioridade,
    prazo: row.prazo,
    status: row.status,
    favorita: row.favorita,
    ...(row.categoria ? { categoria: row.categoria } : {}),
    ...(row.projeto ? { projeto: row.projeto } : {}),
    tags: row.tags ?? [],
    lembrete: row.lembrete,
    lembreteNotificado: row.lembrete_notificado,
    recorrencia: row.recorrencia,
    retornoEm: row.retorno_em,
    subtarefas: row.subtarefas ?? [],
    anotacoes: row.anotacoes ?? [],
    historico: row.historico,
    criadaEm: row.criada_em,
    atualizadaEm: row.atualizada_em ?? undefined,
    concluidaEm: row.concluida_em ?? undefined,
  };
}

function paraPreferencias(row: PreferenciasRow): Preferencias {
  return { tema: row.tema, view: row.view, kpiCollapsed: row.kpi_collapsed };
}

/**
 * Persistência no Supabase — fonte oficial dos dados.
 *
 * `save` sincroniza o conjunto completo: faz upsert em lote das tarefas
 * presentes e exclui as que sumiram (diff pelos ids, preservando os UUIDs).
 */
export class SupabaseProvider implements StorageProvider {
  readonly requiresAuth = true;
  private ultimosIds: string[] = [];

  async load(): Promise<LoadedState | null> {
    const client = getSupabaseClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return null;

    const { data, error } = await client
      .from('tasks')
      .select('*')
      .eq('usuario_id', user.id)
      .order('posicao', { ascending: true });
    if (error) throw error;

    const tasks = ((data ?? []) as TasksRow[]).sort((a, b) => a.posicao - b.posicao).map(paraTarefa);
    this.ultimosIds = tasks.map((t) => t.id);

    const { data: prefRow } = await client
      .from('preferencias')
      .select('*')
      .eq('usuario_id', user.id)
      .maybeSingle();
    const preferencias: Preferencias | null = prefRow ? paraPreferencias(prefRow) : null;

    return { tasks, preferencias };
  }

  async save(state: LoadedState): Promise<void> {
    const client = getSupabaseClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return;

    const linhas = state.tasks.map((t, i) => paraLinha(t, user.id, i));
    if (linhas.length > 0) {
      const { error } = await client.from('tasks').upsert(linhas, { onConflict: 'id' });
      if (error) throw error;
    }

    const ids = new Set(state.tasks.map((t) => t.id));
    const removidos = this.ultimosIds.filter((id) => !ids.has(id));
    if (removidos.length > 0) {
      const { error } = await client.from('tasks').delete().in('id', removidos);
      if (error) throw error;
    }
    this.ultimosIds = [...ids];

    if (state.preferencias) {
      const { error } = await client
        .from('preferencias')
        .upsert(
          {
            usuario_id: user.id,
            tema: state.preferencias.tema,
            view: state.preferencias.view,
            kpi_collapsed: state.preferencias.kpiCollapsed,
            atualizada_em: new Date().toISOString(),
          },
          { onConflict: 'usuario_id' }
        );
      if (error) throw error;
    }
  }

  async clear(): Promise<void> {
    // Sem uso no MVP: a exclusão é feita via diff no save.
  }
}
