import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import { GESTOR_ID, TAREFAS } from '../data/mockData';
import type { Filters, HistoryEntry, ModalState, Section, Task, TaskStatus, TaskView } from '../types';
import { canTransition } from '../utils/status';
import { EMPTY_FILTERS } from '../utils/tasks';
import { loadState, saveState } from '../services/storage';
import { useToast } from './ToastContext';

export interface AppState {
  tasks: Task[];
  currentUserId: string;
  section: Section;
  view: TaskView;
  sidebarCollapsed: boolean;
  filters: Filters;
  modal: ModalState;
}

export type AppAction =
  | { type: 'SET_CURRENT_USER'; userId: string }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SECTION'; section: Section }
  | { type: 'SET_VIEW'; view: TaskView }
  | { type: 'SET_FILTERS'; filters: Partial<Filters> }
  | { type: 'RESET_FILTERS' }
  | { type: 'OPEN_MODAL'; modal: ModalState }
  | { type: 'CLOSE_MODAL' }
  | { type: 'CREATE_TASK'; task: Task }
  | { type: 'UPDATE_TASK'; taskId: string; changes: Partial<Task> }
  | { type: 'CHANGE_STATUS'; taskId: string; novoStatus: TaskStatus; usuario: string; observacao?: string }
  | { type: 'REASSIGN'; taskId: string; responsavelId: string; usuario: string; observacao: string }
  | { type: 'DUPLICATE_TASK'; taskId: string; usuario: string }
  | { type: 'DELETE_TASK'; taskId: string }
  | { type: 'TOGGLE_FAVORITE'; taskId: string };

const initialState: AppState = {
  tasks: TAREFAS,
  currentUserId: GESTOR_ID,
  section: 'tarefas',
  view: 'lista',
  sidebarCollapsed: false,
  filters: EMPTY_FILTERS,
  modal: { type: 'none' },
};

function newHistoryEntry(
  usuario: string,
  statusAnterior: TaskStatus | null,
  novoStatus: TaskStatus | null,
  tipo: HistoryEntry['tipo'],
  observacao?: string
): HistoryEntry {
  return {
    id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    dataHora: new Date().toISOString(),
    usuario,
    statusAnterior,
    novoStatus,
    tipo,
    observacao,
  };
}

export function roleOf(userId: string): 'gestor' | 'colaborador' {
  return userId === GESTOR_ID ? 'gestor' : 'colaborador';
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      return { ...state, currentUserId: action.userId };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case 'SET_SECTION':
      return { ...state, section: action.section };
    case 'SET_VIEW':
      return { ...state, view: action.view };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.filters } };
    case 'RESET_FILTERS':
      return { ...state, filters: EMPTY_FILTERS };
    case 'OPEN_MODAL':
      return { ...state, modal: action.modal };
    case 'CLOSE_MODAL':
      return { ...state, modal: { type: 'none' } };
    case 'CREATE_TASK':
      return { ...state, tasks: [...state.tasks, action.task] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId ? { ...t, ...action.changes } : t
        ),
      };
    case 'CHANGE_STATUS': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;
      if (!canTransition(task.status, action.novoStatus, roleOf(state.currentUserId))) return state;
      const entry = newHistoryEntry(
        action.usuario,
        task.status,
        action.novoStatus,
        'status',
        action.observacao
      );
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? { ...t, status: action.novoStatus, historico: [...t.historico, entry] }
            : t
        ),
      };
    }
    case 'REASSIGN': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;
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
            ? { ...t, responsavelId: action.responsavelId, historico: [...t.historico, entry] }
            : t
        ),
      };
    }
    case 'DUPLICATE_TASK': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;
      const maxNum = state.tasks.reduce((max, t) => {
        const n = Number(t.id.replace(/\D/g, ''));
        return Number.isFinite(n) ? Math.max(max, n) : max;
      }, 0);
      const copy: Task = {
        ...task,
        id: `TA-${String(maxNum + 1).padStart(3, '0')}`,
        status: 'NOVA',
        criadaEm: new Date().toISOString(),
        criadorId: state.currentUserId,
        historico: [newHistoryEntry(action.usuario, null, 'NOVA', 'status', `Tarefa duplicada de ${task.id}.`)],
      };
      return { ...state, tasks: [...state.tasks, copy] };
    }
    case 'DELETE_TASK': {
      if (!state.tasks.some((t) => t.id === action.taskId)) return state;
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.taskId) };
    }
    case 'TOGGLE_FAVORITE':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId ? { ...t, favorita: !t.favorita } : t
        ),
      };
    default:
      return state;
  }
}

const STATUS_TOAST: Record<TaskStatus, string> = {
  NOVA: 'Tarefa criada',
  RECEBIDA: 'Tarefa recebida',
  EM_EXECUCAO: 'Tarefa em execução',
  CONCLUIDA: 'Tarefa concluída — aguardando análise',
  DEVOLVIDA: 'Tarefa devolvida',
  FINALIZADA: 'Tarefa finalizada',
};

function toastMessage(action: AppAction): string | null {
  switch (action.type) {
    case 'CREATE_TASK':
      return 'Tarefa criada';
    case 'UPDATE_TASK':
      return 'Tarefa atualizada';
    case 'DUPLICATE_TASK':
      return 'Tarefa duplicada';
    case 'DELETE_TASK':
      return 'Tarefa excluída';
    case 'REASSIGN':
      return 'Responsável alterado';
    case 'CHANGE_STATUS':
      return STATUS_TOAST[action.novoStatus] ?? null;
    default:
      return null;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

function initState(): AppState {
  const saved = loadState();
  if (saved) {
    return {
      ...initialState,
      tasks: saved.tasks,
      currentUserId: saved.currentUserId,
    };
  }
  return initialState;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState, initState);
  const toast = useToast();

  useEffect(() => {
    saveState({ tasks: state.tasks, currentUserId: state.currentUserId });
  }, [state.tasks, state.currentUserId]);

  const dispatchWithToast = (action: AppAction) => {
    const next = appReducer(state, action);
    dispatch(action);
    if (next.tasks === state.tasks) return; // ação sem efeito (ex.: transição inválida)
    const message = toastMessage(action);
    if (message) toast.success(message);
  };

  const value = useMemo(() => ({ state, dispatch: dispatchWithToast }), [state]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
