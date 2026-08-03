import type { TaskStatus } from '../types';

/** Interpreta 'YYYY-MM-DD' como meia-noite LOCAL (o parse padrão de date-only usa UTC e desloca o dia em fusos negativos). */
function parsePrazo(prazo: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(prazo);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return new Date(prazo);
}

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
  return parsePrazo(prazo) < startOfToday(now);
}

export function isWithinDays(
  prazo: string | null,
  days: number,
  now: Date = new Date()
): boolean {
  if (!prazo) return false;
  const prazoDate = parsePrazo(prazo);
  const hoje = startOfToday(now);
  const limit = new Date(hoje);
  limit.setDate(limit.getDate() + days);
  return prazoDate >= hoje && prazoDate <= limit;
}

export function isDueToday(prazo: string | null, now: Date = new Date()): boolean {
  if (!prazo) return false;
  const prazoDate = parsePrazo(prazo);
  const hoje = startOfToday(now);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);
  return prazoDate >= hoje && prazoDate < amanha;
}
