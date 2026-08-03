import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import { GESTOR_ID, TAREFAS } from '../data/mockData';
import type { Filters, HistoryEntry, ModalState, Section, Task, TaskStatus, TaskView } from '../types';
import { canTransition } from '../utils/status';
import { EMPTY_FILTERS } from '../utils/tasks';

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
  | { type: 'REASSIGN'; taskId: string; responsavelId: string; usuario: string; observacao: string };

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
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
