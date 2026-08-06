import type { TaskStatus } from '../types';
import type { AppAction } from './types';

// Sem 'NOVA': CREATE_TASK tem toast próprio no switch de toastMessage.
const STATUS_TOAST: Partial<Record<TaskStatus, string>> = {
  RECEBIDA: 'Tarefa recebida',
  EM_EXECUCAO: 'Tarefa em execução',
  CONCLUIDA: 'Tarefa concluída — aguardando análise',
  DEVOLVIDA: 'Tarefa devolvida',
  FINALIZADA: 'Tarefa finalizada',
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
    case 'REASSIGN':
      return 'Responsável alterado';
    case 'CHANGE_STATUS':
      return STATUS_TOAST[action.novoStatus] ?? null;
    default:
      return null;
  }
}
