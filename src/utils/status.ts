import type { Priority, TaskStatus } from '../types';

export const STATUS_ORDER: TaskStatus[] = [
  'CAIXA_ENTRADA',
  'A_FAZER',
  'EM_ANDAMENTO',
  'CONCLUIDA',
  'CANCELADA',
];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  CAIXA_ENTRADA: 'Caixa de entrada',
  A_FAZER: 'A fazer',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
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

export const TRANSITIONS: { from: TaskStatus; to: TaskStatus }[] = [
  { from: 'CAIXA_ENTRADA', to: 'A_FAZER' },
  { from: 'A_FAZER', to: 'EM_ANDAMENTO' },
  { from: 'EM_ANDAMENTO', to: 'CONCLUIDA' },
  { from: 'CAIXA_ENTRADA', to: 'CANCELADA' },
  { from: 'A_FAZER', to: 'CANCELADA' },
  { from: 'EM_ANDAMENTO', to: 'CANCELADA' },
  { from: 'CONCLUIDA', to: 'EM_ANDAMENTO' },
];

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return TRANSITIONS.some((t) => t.from === from && t.to === to);
}

export function transicoesDisponiveis(status: TaskStatus): TaskStatus[] {
  return TRANSITIONS.filter((t) => t.from === status).map((t) => t.to);
}
