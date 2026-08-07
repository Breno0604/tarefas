import type { TaskStatus } from '../types';
import type { AppAction } from './types';

// Sem 'CAIXA_ENTRADA': CREATE_TASK tem toast próprio no switch de toastMessage.
const STATUS_TOAST: Partial<Record<TaskStatus, string>> = {
  A_FAZER: 'Tarefa movida para "A fazer"',
  EM_ANDAMENTO: 'Tarefa em andamento',
  CONCLUIDA: 'Tarefa concluída',
  CANCELADA: 'Tarefa cancelada',
};

/** Mensagem de toast por ação, ou null quando a ação não deve exibir toast. */
export function toastMessage(action: AppAction): string | null {
  switch (action.type) {
    case 'CREATE_TASK':
      return 'Tarefa criada';
    case 'UPDATE_TASK':
      return 'Tarefa atualizada';
    case 'DUPLICATE_TASK':
      return 'Tarefa duplicada';
    case 'DELETE_TASK':
      return 'Tarefa excluída';
    case 'CHANGE_STATUS':
      return STATUS_TOAST[action.novoStatus] ?? null;
    default:
      return null;
  }
}
