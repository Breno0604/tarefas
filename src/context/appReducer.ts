import type { Anotacao, Subtarefa, Task } from '../types';
import { canTransition } from '../utils/status';
import { newHistoryEntry } from '../utils/history';
import { formatDate } from '../utils/date';
import { EMPTY_FILTERS, novoId, proximaOcorrencia } from '../utils/tasks';
import type { AppAction, AppState } from './types';

/** Todos os campos editáveis geram entrada de histórico (sem exceções por status). */
const CAMPOS_EDITAVEIS = [
  'titulo',
  'descricao',
  'prazo',
  'prioridade',
  'categoria',
  'tags',
  'projeto',
  'lembrete',
  'recorrencia',
] as const;

type CampoEdicao = (typeof CAMPOS_EDITAVEIS)[number];

const LABEL_CAMPO: Record<string, string> = {
  titulo: 'Título',
  descricao: 'Descrição',
  prazo: 'Prazo',
  prioridade: 'Prioridade',
  categoria: 'Categoria',
  tags: 'Tags',
  projeto: 'Projeto',
  lembrete: 'Lembrete',
  recorrencia: 'Recorrência',
};

const PARTICIPIO_CAMPO: Record<string, string> = {
  titulo: 'alterado',
  descricao: 'alterada',
  prazo: 'alterado',
  prioridade: 'alterada',
  categoria: 'alterada',
  tags: 'alteradas',
  projeto: 'alterado',
  lembrete: 'alterado',
  recorrencia: 'alterada',
};

function exibirValor(campo: string, valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') {
    return campo === 'prazo' ? 'sem prazo' : 'vazio';
  }
  return String(valor);
}

/** Compara valor por valor: tags por conteúdo (ordem preservada), categoria/projeto normalizando vazio. */
function mudou(campo: CampoEdicao, task: Task, mudancas: Partial<Task>): boolean {
  const novo = mudancas[campo];
  if (campo === 'tags') {
    const atual = task.tags ?? [];
    const prox = novo ?? [];
    return atual.length !== prox.length || atual.some((t, i) => t !== prox[i]);
  }
  if (campo === 'categoria' || campo === 'projeto') {
    return (novo ?? '') !== (task[campo] ?? '');
  }
  if (campo === 'lembrete' || campo === 'recorrencia') {
    return (novo ?? null) !== (task[campo] ?? null);
  }
  if (novo === undefined) return false;
  return novo !== task[campo];
}

function montarObservacaoEdicao(diffs: readonly CampoEdicao[], task: Task, changes: Partial<Task>): string {
  return diffs
    .map(
      (campo) =>
        `${LABEL_CAMPO[campo]} ${PARTICIPIO_CAMPO[campo]} de ${exibirValor(campo, task[campo])} para ${exibirValor(campo, changes[campo])}`
    )
    .join('; ');
}

/** Id único para subtarefas/anotações. */
function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function appReducerCore(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_VIEW':
      return { ...state, view: action.view };
    case 'TOGGLE_KPI_COLLAPSED':
      return { ...state, kpiCollapsed: !state.kpiCollapsed };
    case 'TOGGLE_FILTERS':
      return { ...state, filtersOpen: !state.filtersOpen };
    case 'TOGGLE_TEMA':
      return { ...state, tema: state.tema === 'escuro' ? 'claro' : 'escuro' };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.filters } };
    case 'RESET_FILTERS':
      return { ...state, filters: { ...EMPTY_FILTERS } };
    case 'OPEN_MODAL':
      return { ...state, modal: action.modal };
    case 'CLOSE_MODAL':
      return { ...state, modal: { type: 'none' } };
    case 'CREATE_TASK':
      return {
        ...state,
        tasks: [
          ...state.tasks,
          { ...action.task, atualizadaEm: action.task.criadaEm },
        ],
      };
    case 'UPDATE_TASK': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;
      if (Object.keys(action.changes).length === 0) return state;
      const camposForaDaWhitelist = Object.keys(action.changes).filter(
        (campo) => !(CAMPOS_EDITAVEIS as readonly string[]).includes(campo)
      );
      if (camposForaDaWhitelist.length > 0) return state;
      const mudancasEfetivas = CAMPOS_EDITAVEIS.filter((campo) => mudou(campo, task, action.changes));
      if (mudancasEfetivas.length === 0) return state;
      const diffs = mudancasEfetivas;
      const historico = [
        ...task.historico,
        newHistoryEntry(
          task.status,
          task.status,
          'info',
          montarObservacaoEdicao(diffs, task, action.changes)
        ),
      ];
      const mudancasAplicadas: Partial<Task> = {};
      for (const campo of mudancasEfetivas) {
        switch (campo) {
          case 'titulo':
            mudancasAplicadas.titulo = action.changes.titulo;
            break;
          case 'descricao':
            mudancasAplicadas.descricao = action.changes.descricao;
            break;
          case 'prazo':
            mudancasAplicadas.prazo = action.changes.prazo;
            break;
          case 'prioridade':
            mudancasAplicadas.prioridade = action.changes.prioridade;
            break;
          case 'categoria':
            mudancasAplicadas.categoria = action.changes.categoria;
            break;
          case 'tags':
            mudancasAplicadas.tags = action.changes.tags ?? [];
            break;
          case 'projeto':
            mudancasAplicadas.projeto = action.changes.projeto;
            break;
          case 'lembrete':
            mudancasAplicadas.lembrete = action.changes.lembrete ?? null;
            // Lembrete alterado → pode notificar novamente.
            mudancasAplicadas.lembreteNotificado = false;
            break;
          case 'recorrencia':
            mudancasAplicadas.recorrencia = action.changes.recorrencia ?? null;
            break;
        }
      }
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? { ...t, ...mudancasAplicadas, atualizadaEm: new Date().toISOString(), historico }
            : t
        ),
      };
    }
    case 'CHANGE_STATUS': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;
      if (!canTransition(task.status, action.novoStatus)) return state;
      // Arquivar exige motivo obrigatório.
      if (action.novoStatus === 'ARQUIVADA' && !action.observacao?.trim()) return state;
      const observacao =
        action.novoStatus === 'SUSPENSA'
          ? action.retornoEm
            ? `Suspensa; retorno previsto em ${formatDate(action.retornoEm)}.`
            : 'Suspensa sem prazo definido de retorno.'
          : action.novoStatus === 'ARQUIVADA'
            ? `Arquivada: ${action.observacao}`
            : action.novoStatus === 'CAIXA_ENTRADA' && task.status === 'ARQUIVADA'
              ? 'Tarefa desarquivada.'
              : action.observacao;
      const entry = newHistoryEntry(
        task.status,
        action.novoStatus,
        'status',
        observacao
      );
      const agora = new Date().toISOString();
      const concluida: Task = {
        ...task,
        status: action.novoStatus,
        atualizadaEm: agora,
        concluidaEm:
          action.novoStatus === 'CONCLUIDA'
            ? agora
            : action.novoStatus === 'EM_ANDAMENTO'
              ? undefined
              : task.concluidaEm,
        // Ao reabrir/retomar (EM_ANDAMENTO), o lembrete volta a poder notificar.
        lembreteNotificado:
          action.novoStatus === 'EM_ANDAMENTO' ? false : task.lembreteNotificado,
        retornoEm:
          action.novoStatus === 'SUSPENSA'
            ? action.retornoEm ?? null
            : task.status === 'SUSPENSA'
              ? null
              : task.retornoEm,
        historico: [...task.historico, entry],
      };
      if (action.novoStatus === 'CONCLUIDA' && task.recorrencia) {
        // Gera a próxima ocorrência da tarefa recorrente.
        const ocorrencia: Task = {
          ...task,
          id: novoId(),
          status: 'CAIXA_ENTRADA',
          prazo: proximaOcorrencia(task.prazo, task.recorrencia),
          criadaEm: agora,
          atualizadaEm: agora,
          concluidaEm: undefined,
          lembrete: null,
          lembreteNotificado: false,
          retornoEm: null,
          anotacoes: [],
          subtarefas: (task.subtarefas ?? []).map((s) => ({ ...s, concluida: false })),
          historico: [
            newHistoryEntry(
              null,
              'CAIXA_ENTRADA',
              'status',
              `Próxima ocorrência (${task.recorrencia}) de "${task.titulo}".`
            ),
          ],
        };
        return {
          ...state,
          tasks: [
            ...state.tasks.map((t) => (t.id === action.taskId ? concluida : t)),
            ocorrencia,
          ],
        };
      }
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.taskId ? concluida : t)),
      };
    }
    case 'DUPLICATE_TASK': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;
      const agora = new Date().toISOString();
      const copy: Task = {
        ...task,
        id: novoId(),
        status: 'CAIXA_ENTRADA',
        favorita: false,
        criadaEm: agora,
        atualizadaEm: agora,
        concluidaEm: undefined,
        lembrete: null,
        lembreteNotificado: false,
        retornoEm: null,
        historico: [newHistoryEntry(null, 'CAIXA_ENTRADA', 'status', `Tarefa duplicada de "${task.titulo}".`)],
      };
      return { ...state, tasks: [...state.tasks, copy] };
    }
    case 'DELETE_TASK': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;
      // Registra a exclusão no histórico (exclusão definitiva; undo restaura).
      const comHistorico: Task = {
        ...task,
        historico: [
          ...task.historico,
          newHistoryEntry(task.status, task.status, 'info', 'Tarefa excluída.'),
        ],
      };
      return {
        ...state,
        tasks: state.tasks
          .map((t) => (t.id === action.taskId ? comHistorico : t))
          .filter((t) => t.id !== action.taskId),
      };
    }
    case 'TOGGLE_FAVORITE': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;
      // Favoritar é uma alteração de dados da tarefa → registrada no histórico (sem exceções).
      const novaFavorita = !task.favorita;
      const entry = newHistoryEntry(
        task.status,
        task.status,
        'info',
        novaFavorita ? 'Tarefa adicionada aos favoritos.' : 'Tarefa removida dos favoritos.'
      );
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? {
                ...t,
                favorita: novaFavorita,
                atualizadaEm: new Date().toISOString(),
                historico: [...t.historico, entry],
              }
            : t
        ),
      };
    }
    case 'REORDER_TASKS': {
      const from = state.tasks.findIndex((t) => t.id === action.taskId);
      const to = state.tasks.findIndex((t) => t.id === action.toTaskId);
      if (from < 0 || to < 0 || from === to) return state;
      const tasks = [...state.tasks];
      const [moved] = tasks.splice(from, 1);
      // Ao mover para baixo, a remoção desloca o alvo em -1; insere "antes" do alvo.
      const target = from < to ? to - 1 : to;
      tasks.splice(target, 0, moved);
      return { ...state, tasks };
    }
    case 'ADD_SUBTAREFA': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      const titulo = action.titulo.trim();
      if (!task || !titulo) return state;
      const item: Subtarefa = { id: uid('st'), titulo, concluida: false };
      const entry = newHistoryEntry(
        task.status,
        task.status,
        'info',
        `Subtarefa "${titulo}" adicionada.`
      );
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? {
                ...t,
                subtarefas: [...(t.subtarefas ?? []), item],
                atualizadaEm: new Date().toISOString(),
                historico: [...t.historico, entry],
              }
            : t
        ),
      };
    }
    case 'TOGGLE_SUBTAREFA': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      const item = task?.subtarefas?.find((s) => s.id === action.subtarefaId);
      if (!task || !item) return state;
      const entry = newHistoryEntry(
        task.status,
        task.status,
        'info',
        `Subtarefa "${item.titulo}" ${item.concluida ? 'reativada' : 'concluída'}.`
      );
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? {
                ...t,
                subtarefas: t.subtarefas?.map((s) =>
                  s.id === action.subtarefaId ? { ...s, concluida: !s.concluida } : s
                ),
                atualizadaEm: new Date().toISOString(),
                historico: [...t.historico, entry],
              }
            : t
        ),
      };
    }
    case 'UPDATE_SUBTAREFA': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      const item = task?.subtarefas?.find((s) => s.id === action.subtarefaId);
      const titulo = action.titulo.trim();
      if (!task || !item || !titulo || titulo === item.titulo) return state;
      const entry = newHistoryEntry(
        task.status,
        task.status,
        'info',
        `Subtarefa "${item.titulo}" renomeada para "${titulo}".`
      );
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? {
                ...t,
                subtarefas: t.subtarefas?.map((s) =>
                  s.id === action.subtarefaId ? { ...s, titulo } : s
                ),
                atualizadaEm: new Date().toISOString(),
                historico: [...t.historico, entry],
              }
            : t
        ),
      };
    }
    case 'REMOVE_SUBTAREFA': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      const item = task?.subtarefas?.find((s) => s.id === action.subtarefaId);
      if (!task || !item) return state;
      const entry = newHistoryEntry(
        task.status,
        task.status,
        'info',
        `Subtarefa "${item.titulo}" removida.`
      );
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? {
                ...t,
                subtarefas: t.subtarefas?.filter((s) => s.id !== action.subtarefaId),
                atualizadaEm: new Date().toISOString(),
                historico: [...t.historico, entry],
              }
            : t
        ),
      };
    }
    case 'ADD_ANOTACAO': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      const texto = action.texto.trim();
      if (!task || !texto) return state;
      const nota: Anotacao = { id: uid('an'), texto, criadaEm: new Date().toISOString() };
      const entry = newHistoryEntry(
        task.status,
        task.status,
        'info',
        `Anotação adicionada: "${texto}".`
      );
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? {
                ...t,
                anotacoes: [...(t.anotacoes ?? []), nota],
                atualizadaEm: new Date().toISOString(),
                historico: [...t.historico, entry],
              }
            : t
        ),
      };
    }
    case 'UPDATE_ANOTACAO': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      const nota = task?.anotacoes?.find((a) => a.id === action.anotacaoId);
      const texto = action.texto.trim();
      if (!task || !nota || !texto || texto === nota.texto) return state;
      const entry = newHistoryEntry(
        task.status,
        task.status,
        'info',
        `Anotação editada de "${nota.texto}" para "${texto}".`
      );
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? {
                ...t,
                anotacoes: t.anotacoes?.map((a) =>
                  a.id === action.anotacaoId ? { ...a, texto } : a
                ),
                atualizadaEm: new Date().toISOString(),
                historico: [...t.historico, entry],
              }
            : t
        ),
      };
    }
    case 'REMOVE_ANOTACAO': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      const nota = task?.anotacoes?.find((a) => a.id === action.anotacaoId);
      if (!task || !nota) return state;
      const entry = newHistoryEntry(
        task.status,
        task.status,
        'info',
        `Anotação removida: "${nota.texto}".`
      );
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? {
                ...t,
                anotacoes: t.anotacoes?.filter((a) => a.id !== action.anotacaoId),
                atualizadaEm: new Date().toISOString(),
                historico: [...t.historico, entry],
              }
            : t
        ),
      };
    }
    case 'MARK_LEMBRETE_NOTIFICADO': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task || task.lembreteNotificado) return state;
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId ? { ...t, lembreteNotificado: true } : t
        ),
      };
    }
    case 'HYDRATE':
      // Carrega o estado vindo do Supabase (não entra na pilha de undo).
      return {
        ...state,
        tasks: action.tasks,
        tema: action.preferencias?.tema ?? state.tema,
        view: action.preferencias?.view ?? state.view,
        kpiCollapsed: action.preferencias?.kpiCollapsed ?? state.kpiCollapsed,
        past: [],
      };
    default:
      return state;
  }
}

const UNDO_LIMIT = 50;

/** Ações que mudam tarefas mas NÃO entram na pilha de undo (sem toast; undo seria confuso). */
const NO_UNDO: ReadonlySet<AppAction['type']> = new Set([
  'TOGGLE_FAVORITE',
  'REORDER_TASKS',
  'TOGGLE_SUBTAREFA',
  'MARK_LEMBRETE_NOTIFICADO',
  'HYDRATE',
]);

/**
 * Reducer público: aplica a ação e empilha o estado anterior em `past` sempre que
 * as tarefas mudam (base para o Desfazer). UNDO é tratado aqui, fora da pilha.
 */
export function appReducer(state: AppState, action: AppAction): AppState {
  if (action.type === 'UNDO') {
    if (state.past.length === 0) return state;
    const tasks = state.past[state.past.length - 1];
    return { ...state, tasks, past: state.past.slice(0, -1) };
  }
  const next = appReducerCore(state, action);
  if (next.tasks === state.tasks) return next;
  if (NO_UNDO.has(action.type)) return next;
  return { ...next, past: [...state.past, state.tasks].slice(-UNDO_LIMIT) };
}
