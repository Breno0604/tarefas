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
  return parsePrazo(iso).toLocaleDateString('pt-BR');
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const data = d.toLocaleDateString('pt-BR');
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${data} ${hora}`;
}

/** 'YYYY-MM-DDTHH:mm' no fuso local — formato usado pelos lembretes (datetime-local). */
export function formatLocalMinute(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
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
  if (!prazo || status === 'CONCLUIDA' || status === 'ARQUIVADA' || status === 'SUSPENSA') return false;
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

/** Dias inteiros decorridos desde um timestamp ISO (0 se hoje ou no futuro). */
export function diasDesde(iso: string, now: Date = new Date()): number {
  const inicio = startOfToday(new Date(iso));
  const hoje = startOfToday(now);
  return Math.max(0, Math.round((hoje.getTime() - inicio.getTime()) / 86_400_000));
}

/** Texto relativo para uma idade em dias ("hoje", "há 1 dia", "há 3 dias"). */
export function idadeRelativa(dias: number): string {
  if (dias <= 0) return 'hoje';
  return `há ${dias} dia${dias === 1 ? '' : 's'}`;
}
