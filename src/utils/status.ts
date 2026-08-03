import type { Priority, Role, TaskStatus } from '../types';
import { GESTOR_ID } from '../data/mockData';

export function roleOf(userId: string): Role {
  return userId === GESTOR_ID ? 'gestor' : 'colaborador';
}

export const STATUS_ORDER: TaskStatus[] = [
  'NOVA',
  'RECEBIDA',
  'EM_EXECUCAO',
  'CONCLUIDA',
  'FINALIZADA',
];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  NOVA: 'Nova',
  RECEBIDA: 'Recebida',
  EM_EXECUCAO: 'Em execução',
  CONCLUIDA: 'Concluída',
  DEVOLVIDA: 'Devolvida',
  FINALIZADA: 'Finalizada',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
};

export const PRIORITY_RANK: Record<Priority, number> = {
  critica: 0,
  alta: 1,
  media: 2,
  baixa: 3,
};

export const TRANSITIONS: { from: TaskStatus; to: TaskStatus; role: Role }[] = [
  { from: 'NOVA', to: 'RECEBIDA', role: 'colaborador' },
  { from: 'RECEBIDA', to: 'EM_EXECUCAO', role: 'colaborador' },
  { from: 'EM_EXECUCAO', to: 'CONCLUIDA', role: 'colaborador' },
  { from: 'CONCLUIDA', to: 'FINALIZADA', role: 'gestor' },
  { from: 'CONCLUIDA', to: 'DEVOLVIDA', role: 'gestor' },
  { from: 'CONCLUIDA', to: 'EM_EXECUCAO', role: 'colaborador' },
  { from: 'DEVOLVIDA', to: 'EM_EXECUCAO', role: 'colaborador' },
];

export function canTransition(from: TaskStatus, to: TaskStatus, role: Role): boolean {
  return TRANSITIONS.some((t) => t.from === from && t.to === to && t.role === role);
}

export function availableTransitions(status: TaskStatus, role: Role): TaskStatus[] {
  return TRANSITIONS.filter((t) => t.from === status && t.role === role).map((t) => t.to);
}
