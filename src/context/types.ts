import type { Filters, ModalState, Section, Task, TaskStatus, TaskView } from '../types';

export interface AppState {
  tasks: Task[];
  currentUserId: string;
  section: Section;
  view: TaskView;
  sidebarOpen: boolean;
  filters: Filters;
  modal: ModalState;
  past: Task[][]; // pilha de estados anteriores (undo), não persistida
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
  | { type: 'UPDATE_TASK'; taskId: string; changes: Partial<Task>; usuario: string }
  | { type: 'CHANGE_STATUS'; taskId: string; novoStatus: TaskStatus; usuario: string; observacao?: string }
  | { type: 'REASSIGN'; taskId: string; responsavelId: string; usuario: string; observacao: string }
  | { type: 'DUPLICATE_TASK'; taskId: string; usuario: string }
  | { type: 'DELETE_TASK'; taskId: string }
  | { type: 'TOGGLE_FAVORITE'; taskId: string }
  | { type: 'REORDER_TASKS'; taskId: string; toTaskId: string }
  | { type: 'UNDO' };
