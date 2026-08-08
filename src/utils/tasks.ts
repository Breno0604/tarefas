import type {
  Filters,
  Priority,
  Recorrencia,
  Task,
  TaskStatus,
} from '../types';
import { isDueToday, isOverdue, isWithinDays } from './date';
import { newHistoryEntry } from './history';

/** Valor do filtro `categorias` que representa tarefas sem categoria. */
export const SEM_CATEGORIA = '__sem_categoria__';

export const EMPTY_FILTERS: Filters = {
  search: '',
  status: [],
  prioridade: [],
  prazo: 'todas',
  favoritas: false,
  categorias: [],
  tags: [],
};

export function hasActiveFilters(filters: Filters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.status.length > 0 ||
    filters.prioridade.length > 0 ||
    filters.prazo !== 'todas' ||
    filters.favoritas ||
    filters.categorias.length > 0 ||
    filters.tags.length > 0
  );
}

export function filterTasks(
  tasks: Task[],
  filters: Filters,
  now: Date = new Date()
): Task[] {
  // Busca: termos livres (contra id/título/descrição/tags) + termos "#tag" (contra tags apenas).
  const tokens = filters.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const tagTokens = tokens.filter((tok) => tok.startsWith('#')).map((tok) => tok.slice(1));
  const textTokens = tokens.filter((tok) => !tok.startsWith('#'));
  return tasks.filter((t) => {
    if (textTokens.length > 0) {
      const hay = `${t.id} ${t.titulo} ${t.descricao} ${(t.tags ?? []).join(' ')}`.toLowerCase();
      if (!textTokens.every((tok) => hay.includes(tok))) return false;
    }
    if (tagTokens.length > 0) {
      const tagText = (t.tags ?? []).join(' ').toLowerCase();
      if (!tagTokens.every((tok) => tagText.includes(tok))) return false;
    }
    if (filters.status.length > 0 && !filters.status.includes(t.status)) return false;
    if (filters.prioridade.length > 0 && !filters.prioridade.includes(t.prioridade))
      return false;
    if (filters.favoritas && !t.favorita) return false;
    if (filters.categorias.length > 0) {
      const semCategoria = filters.categorias.includes(SEM_CATEGORIA);
      const cats = filters.categorias.filter((c) => c !== SEM_CATEGORIA);
      const passouSemCategoria = semCategoria && !t.categoria;
      const passouCategoria =
        cats.length > 0 && typeof t.categoria === 'string' && cats.includes(t.categoria);
      if (!passouSemCategoria && !passouCategoria) return false;
    }
    if (filters.tags.length > 0) {
      const tagsDaTarefa = t.tags ?? [];
      if (!tagsDaTarefa.some((tag) => filters.tags.includes(tag))) return false;
    }
    if (filters.prazo === 'hoje' && !isDueToday(t.prazo, now)) return false;
    if (filters.prazo === 'vencidas' && !isOverdue(t.prazo, t.status, now)) return false;
    if (filters.prazo === 'proximos7' && !isWithinDays(t.prazo, 7, now)) return false;
    if (filters.prazo === 'semPrazo' && t.prazo !== null) return false;
    return true;
  });
}

export interface Indicators {
  total: number;
  caixaEntrada: number;
  aFazer: number;
  emAndamento: number;
  suspensas: number;
  concluidas: number;
  arquivadas: number;
  atrasadas: number;
}

export function computeIndicators(tasks: Task[], now: Date = new Date()): Indicators {
  const counts: Record<TaskStatus, number> = {
    CAIXA_ENTRADA: 0,
    A_FAZER: 0,
    EM_ANDAMENTO: 0,
    SUSPENSA: 0,
    CONCLUIDA: 0,
    ARQUIVADA: 0,
  };
  let atrasadas = 0;
  for (const t of tasks) {
    counts[t.status]++;
    if (isOverdue(t.prazo, t.status, now)) atrasadas++;
  }
  return {
    total: tasks.length,
    caixaEntrada: counts.CAIXA_ENTRADA,
    aFazer: counts.A_FAZER,
    emAndamento: counts.EM_ANDAMENTO,
    suspensas: counts.SUSPENSA,
    concluidas: counts.CONCLUIDA,
    arquivadas: counts.ARQUIVADA,
    atrasadas,
  };
}

/** Contagem e progresso de subtarefas de uma tarefa. */
export function subtarefasProgresso(task: Task): {
  feitas: number;
  total: number;
  pct: number;
} {
  const lista = task.subtarefas ?? [];
  const feitas = lista.filter((s) => s.concluida).length;
  return { feitas, total: lista.length, pct: lista.length === 0 ? 0 : Math.round((feitas / lista.length) * 100) };
}

/** Pad 'YYYY-MM-DD'. */
function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Próxima data de ocorrência a partir de um prazo ISO e da frequência. */
export function proximaOcorrencia(
  prazo: string | null,
  freq: Recorrencia
): string | null {
  if (!prazo) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(prazo);
  if (!m) return prazo;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (freq === 'diaria') {
    d.setDate(d.getDate() + 1);
  } else if (freq === 'semanal') {
    d.setDate(d.getDate() + 7);
  } else {
    // mensal: mantém o dia, clampeado ao último dia do mês quando necessário (ex.: 31/01 → 28/02).
    const dia = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(dia, ultimo));
  }
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Projetos presentes nas tarefas, únicos e ordenados. */
export function projetosDe(tasks: Task[]): string[] {
  return Array.from(new Set(tasks.map((t) => t.projeto).filter((p): p is string => Boolean(p)))).sort(
    (a, b) => a.localeCompare(b)
  );
}

/** Gera um id único (UUID) para novas tarefas. */
export function novoId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface NewTaskInput {
  titulo: string;
  descricao: string;
  prioridade: Priority;
  prazo: string | null;
  categoria?: string;
  tags?: string[];
  projeto?: string;
  lembrete?: string | null;
  recorrencia?: Recorrencia | null;
}

/**
 * Monta uma tarefa CAIXA_ENTRADA pronta para CREATE_TASK: id único (UUID), timestamps
 * e entrada de histórico de criação. Usado pelo TaskFormModal.
 */
export function createTask(input: NewTaskInput): Task {
  const agora = new Date().toISOString();
  return {
    id: novoId(),
    titulo: input.titulo,
    descricao: input.descricao,
    prioridade: input.prioridade,
    prazo: input.prazo,
    status: 'CAIXA_ENTRADA',
    ...(input.categoria ? { categoria: input.categoria } : {}),
    ...(input.tags && input.tags.length > 0 ? { tags: input.tags } : {}),
    ...(input.projeto ? { projeto: input.projeto } : {}),
    ...(input.lembrete ? { lembrete: input.lembrete } : {}),
    ...(input.recorrencia ? { recorrencia: input.recorrencia } : {}),
    criadaEm: agora,
    historico: [newHistoryEntry(null, 'CAIXA_ENTRADA', 'status', 'Tarefa criada.')],
  };
}
