import type { Filters, ModalState, Task, TaskStatus, TaskView, Tema } from '../types';

export interface AppState {
  tasks: Task[];
  view: TaskView;
  sidebarOpen: boolean;
  filters: Filters;
  kpiCollapsed: boolean; // indicadores recolhidos (persistido no Supabase)
  filtersOpen: boolean; // barra de filtros visível
  modal: ModalState;
  past: Task[][]; // pilha de estados anteriores (undo), não persistida
  tema: Tema; // claro | escuro (persistido no Supabase)
}

export type AppAction =
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_VIEW'; view: TaskView }
  | { type: 'TOGGLE_KPI_COLLAPSED' }
  | { type: 'TOGGLE_FILTERS' }
  | { type: 'SET_FILTERS'; filters: Partial<Filters> }
  | { type: 'RESET_FILTERS' }
  | { type: 'OPEN_MODAL'; modal: ModalState }
  | { type: 'CLOSE_MODAL' }
  | { type: 'CREATE_TASK'; task: Task }
  | { type: 'UPDATE_TASK'; taskId: string; changes: Partial<Task> }
  | {
      type: 'CHANGE_STATUS';
      taskId: string;
      novoStatus: TaskStatus;
      observacao?: string;
      retornoEm?: string | null; // usado ao suspender (SUSPENSA)
    }
  | { type: 'DUPLICATE_TASK'; taskId: string }
  | { type: 'DELETE_TASK'; taskId: string; observacao?: string }
  | { type: 'TOGGLE_FAVORITE'; taskId: string }
  | { type: 'REORDER_TASKS'; taskId: string; toTaskId: string }
  | { type: 'ADD_SUBTAREFA'; taskId: string; titulo: string }
  | { type: 'TOGGLE_SUBTAREFA'; taskId: string; subtarefaId: string }
  | { type: 'UPDATE_SUBTAREFA'; taskId: string; subtarefaId: string; titulo: string }
  | { type: 'REMOVE_SUBTAREFA'; taskId: string; subtarefaId: string }
  | { type: 'ADD_ANOTACAO'; taskId: string; texto: string }
  | { type: 'UPDATE_ANOTACAO'; taskId: string; anotacaoId: string; texto: string }
  | { type: 'REMOVE_ANOTACAO'; taskId: string; anotacaoId: string }
  | { type: 'MARK_LEMBRETE_NOTIFICADO'; taskId: string }
  | { type: 'TOGGLE_TEMA' }
  | { type: 'UNDO' }
  | {
      type: 'HYDRATE';
      tasks: Task[];
      preferencias: { tema: Tema; view: TaskView; kpiCollapsed: boolean } | null;
    };
