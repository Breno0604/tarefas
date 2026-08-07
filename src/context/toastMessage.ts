import type { TaskStatus } from '../types';
import type { AppAction } from './types';

// Sem 'CAIXA_ENTRADA': CREATE_TASK tem toast próprio no switch de toastMessage.
const STATUS_TOAST: Partial<Record<TaskStatus, string>> = {
  A_FAZER: 'Tarefa movida para "A fazer"',
  EM_ANDAMENTO: 'Tarefa em andamento',
  SUSPENSA: 'Tarefa suspensa',
  CONCLUIDA: 'Tarefa concluída',
  ARQUIVADA: 'Tarefa arquivada',
  CAIXA_ENTRADA: 'Tarefa movida para a caixa de entrada',
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
    case 'ADD_SUBTAREFA':
      return 'Subtarefa adicionada';
    case 'REMOVE_SUBTAREFA':
      return 'Subtarefa removida';
    case 'ADD_ANOTACAO':
      return 'Anotação adicionada';
    case 'REMOVE_ANOTACAO':
      return 'Anotação removida';
    default:
      return null;
  }
}
