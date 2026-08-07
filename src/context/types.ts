import type { Filters, ModalState, Task, TaskStatus, TaskView } from '../types';

export interface AppState {
  tasks: Task[];
  view: TaskView;
  sidebarOpen: boolean;
  filters: Filters;
  kpiCollapsed: boolean; // indicadores recolhidos (persistido em localStorage)
  filtersOpen: boolean; // barra de filtros visível
  modal: ModalState;
  past: Task[][]; // pilha de estados anteriores (undo), não persistida
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
  | { type: 'CHANGE_STATUS'; taskId: string; novoStatus: TaskStatus; observacao?: string }
  | { type: 'DUPLICATE_TASK'; taskId: string }
  | { type: 'DELETE_TASK'; taskId: string }
  | { type: 'TOGGLE_FAVORITE'; taskId: string }
  | { type: 'REORDER_TASKS'; taskId: string; toTaskId: string }
  | { type: 'UNDO' };
