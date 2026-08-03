import type { TaskStatus } from '../types';

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const data = d.toLocaleDateString('pt-BR');
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${data} ${hora}`;
}

export function startOfToday(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isOverdue(
  prazo: string | null,
  status: TaskStatus,
  now: Date = new Date()
): boolean {
  if (!prazo || status === 'FINALIZADA') return false;
  return new Date(prazo) < startOfToday(now);
}

export function isWithinDays(
  prazo: string | null,
  days: number,
  now: Date = new Date()
): boolean {
  if (!prazo) return false;
  const prazoDate = new Date(prazo);
  const limit = new Date(startOfToday(now));
  limit.setDate(limit.getDate() + days);
  return prazoDate >= startOfToday(now) && prazoDate <= limit;
}
