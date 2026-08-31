import type { TaskStatus } from '../types'

const MONTHS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez'
]

const MONTHS_FULL = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
]

/**
 * Parses an ISO date/datetime into a local Date.
 * Date-only strings (YYYY-MM-DD) are treated as local time instead of UTC
 * to avoid off-by-one day shifts in negative UTC offsets.
 */
export function parseDate(iso: string | null | undefined): Date {
  if (typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, m - 1, d, 12, 0, 0, 0)
  }
  if (!iso) return new Date(NaN)
  return new Date(iso)
}

/**
 * Converts a 'YYYY-MM-DD' date key to a local Date object.
 * Avoids timezone shifts that occur when using `new Date('2026-08-30')`.
 */
export function dateKeyToLocalDate(key: string | null | undefined): Date {
  if (!key || typeof key !== 'string') return new Date(NaN)
  const match = key.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return new Date(NaN)
  const [, y, m, d] = match.map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Converts a Date object (or ISO string) to a local 'YYYY-MM-DD' date key.
 * Uses local calendar fields, never toISOString(), to avoid timezone shifts.
 */
export function localDateToKey(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Today's date key in local time (YYYY-MM-DD). */
export function todayKey(): string {
  return localDateToKey(new Date())
}

/** Check if an ISO date string represents today. */
export function isTodayKey(iso: string | null | undefined): boolean {
  if (!iso) return false
  return localDateKey(iso) === todayKey()
}

/**
 * Check if a due date is in the past (before today).
 * Uses calendar date comparison, not timestamps.
 */
export function isPastDateKey(iso: string | null | undefined): boolean {
  if (!iso) return false
  return localDateKey(iso) < todayKey()
}

/** Local calendar date key (YYYY-MM-DD) for a given ISO datetime or date key. */
export function localDateKey(iso: string | null | undefined): string {
  // Use parseDate to correctly handle date-only strings as local time
  const d = parseDate(iso)
  if (isNaN(d.getTime())) return ''
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function formatDate(iso: string | null | undefined, opts: { time?: boolean } = {}): string {
  if (!iso) return '—'
  const d = parseDate(iso)
  if (isNaN(d.getTime())) return '—'
  const day = String(d.getDate()).padStart(2, '0')
  const month = MONTHS[d.getMonth()]
  const year = d.getFullYear()
  const time = opts.time
    ? ` · ${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`
    : ''
  return `${day} ${month} ${year}${time}`
}

export function formatDay(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = parseDate(iso)
  if (isNaN(d.getTime())) return '—'
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]}`
}

export function isOverdue(iso: string | null | undefined, status: TaskStatus): boolean {
  if (!iso || status === 'done' || status === 'cancelled') return false
  return isPastDateKey(iso)
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso as string).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'agora mesmo'
  if (mins < 60) return `há ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `há ${hours} h`
  const days = Math.round(hours / 24)
  if (days === 1) return 'ontem'
  if (days < 30) return `há ${days} dias`
  const months = Math.round(days / 30)
  if (months === 1) return 'há 1 mês'
  if (months < 12) return `há ${months} meses`
  return formatDate(iso)
}

export function initials(name: string | null | undefined): string {
  if (!name) return '??'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function monthName(index: number): string {
  return MONTHS_FULL[index]
}

export function weekdayShort(index: number): string {
  return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][index]
}

export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfDay(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

export function todayISO(): string {
  return startOfDay().toISOString()
}
