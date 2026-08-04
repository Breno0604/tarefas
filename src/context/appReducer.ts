import type { Task } from '../types';
import { canTransition, roleOf } from '../utils/status';
import { pode, podeAlterarStatus } from '../utils/permissions';
import { newHistoryEntry } from '../utils/history';
import { EMPTY_FILTERS, nextTaskId } from '../utils/tasks';
import type { AppAction, AppState } from './types';

function appReducerCore(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      return { ...state, currentUserId: action.userId };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_SECTION':
      return { ...state, section: action.section };
    case 'SET_VIEW':
      return { ...state, view: action.view };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.filters } };
    case 'RESET_FILTERS':
      // Limpa apenas os filtros; a ordenação escolhida é preservada (reset via seletor "Ordem original").
      return { ...state, filters: { ...EMPTY_FILTERS, sortBy: state.filters.sortBy } };
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
      if (!pode(state.currentUserId, 'gerenciar_tarefas')) return state;
      if (Object.keys(action.changes).length === 0) return state;
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? { ...t, ...action.changes, atualizadaEm: new Date().toISOString() }
            : t
        ),
      };
    }
    case 'CHANGE_STATUS': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;
      if (!podeAlterarStatus(state.currentUserId, task)) return state;
      if (!canTransition(task.status, action.novoStatus, roleOf(state.currentUserId))) return state;
      const entry = newHistoryEntry(
        action.usuario,
        task.status,
        action.novoStatus,
        'status',
        action.observacao
      );
      const agora = new Date().toISOString();
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? {
                ...t,
                status: action.novoStatus,
                atualizadaEm: agora,
                concluidaEm:
                  action.novoStatus === 'CONCLUIDA'
                    ? agora
                    : action.novoStatus === 'FINALIZADA'
                      ? t.concluidaEm
                      : undefined,
                historico: [...t.historico, entry],
              }
            : t
        ),
      };
    }
    case 'REASSIGN': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;
      if (!pode(state.currentUserId, 'gerenciar_tarefas')) return state;
      const entry = newHistoryEntry(
        action.usuario,
        task.status,
        task.status,
        'info',
        action.observacao
      );
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? {
                ...t,
                responsavelId: action.responsavelId,
                atualizadaEm: new Date().toISOString(),
                historico: [...t.historico, entry],
              }
            : t
        ),
      };
    }
    case 'DUPLICATE_TASK': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;
      if (!pode(state.currentUserId, 'gerenciar_tarefas')) return state;
      const agora = new Date().toISOString();
      const copy: Task = {
        ...task,
        id: nextTaskId(state.tasks),
        status: 'NOVA',
        favorita: false,
        criadaEm: agora,
        atualizadaEm: agora,
        concluidaEm: undefined,
        criadorId: state.currentUserId,
        historico: [newHistoryEntry(action.usuario, null, 'NOVA', 'status', `Tarefa duplicada de ${task.id}.`)],
      };
      return { ...state, tasks: [...state.tasks, copy] };
    }
    case 'DELETE_TASK': {
      if (!state.tasks.some((t) => t.id === action.taskId)) return state;
      if (!pode(state.currentUserId, 'gerenciar_tarefas')) return state;
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.taskId) };
    }
    case 'TOGGLE_FAVORITE': {
      if (!state.tasks.some((t) => t.id === action.taskId)) return state;
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? { ...t, favorita: !t.favorita, atualizadaEm: new Date().toISOString() }
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
    default:
      return state;
  }
}

const UNDO_LIMIT = 50;

/** Ações que mudam tarefas mas NÃO entram na pilha de undo (sem toast; undo seria confuso). */
const NO_UNDO: ReadonlySet<AppAction['type']> = new Set(['TOGGLE_FAVORITE', 'REORDER_TASKS']);

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
