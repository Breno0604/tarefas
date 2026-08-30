export const STATUS = {
  todo: {
    key: 'todo',
    label: 'A fazer',
    hex: '#94a3b8',
    badge:
      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    dot: 'bg-slate-400',
    bar: 'bg-slate-400'
  },
  in_progress: {
    key: 'in_progress',
    label: 'Em andamento',
    hex: '#3b82f6',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
    dot: 'bg-blue-500',
    bar: 'bg-blue-500'
  },
  done: {
    key: 'done',
    label: 'Concluída',
    hex: '#10b981',
    badge:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500'
  },
  cancelled: {
    key: 'cancelled',
    label: 'Cancelada',
    hex: '#94a3b8',
    badge:
      'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300',
    dot: 'bg-slate-400',
    bar: 'bg-slate-400'
  }
}

export const KANBAN_COLUMNS = ['todo', 'in_progress', 'done', 'cancelled']

export const PRIORITY = {
  low: { key: 'low', label: 'Baixa', hex: '#64748b', rank: 0 },
  medium: { key: 'medium', label: 'Média', hex: '#3b82f6', rank: 1 },
  high: { key: 'high', label: 'Alta', hex: '#f97316', rank: 2 },
  urgent: { key: 'urgent', label: 'Urgente', hex: '#ef4444', rank: 3 }
}

export const PRIORITY_ORDER = ['urgent', 'high', 'medium', 'low']

export const SORT_OPTIONS = [
  { key: 'dueDate', label: 'Vencimento (próximos primeiro)' },
  { key: 'dueDate_desc', label: 'Vencimento (últimos primeiro)' },
  { key: 'priority', label: 'Prioridade' },
  { key: 'createdAt', label: 'Criação (recentes primeiro)' },
  { key: 'title', label: 'Título (A–Z)' }
]

export const VIEWS = [
  { key: 'list', label: 'Lista' },
  { key: 'kanban', label: 'Kanban' },
  { key: 'table', label: 'Tabela' },
  { key: 'calendar', label: 'Calendário' }
]

export const RECURRENCE = {
  none: { key: 'none', label: 'Não repetir' },
  daily: { key: 'daily', label: 'Todos os dias' },
  weekly: { key: 'weekly', label: 'Toda semana' },
  monthly: { key: 'monthly', label: 'Todo mês' }
}

export const RECURRENCE_KEYS = ['none', 'daily', 'weekly', 'monthly']

/**
 * Calcula a data da próxima ocorrência de uma tarefa recorrente.
 * Trata datas como calendário (YYYY-MM-DD) para evitar deslocamentos de fuso.
 * Para recorrência mensal, preserva o dia ou usa o último dia do mês
 * quando o dia original não existe no próximo mês (ex: 31 jan → 28/29 fev).
 * @param {string|null} dueDate Data base (ISO date or datetime). Se nula, usa hoje.
 * @param {'daily'|'weekly'|'monthly'} recurrence
 * @returns {string} 'YYYY-MM-DD' date key
 */
export function nextRecurrenceDate(dueDate, recurrence) {
  let year, month, day
  if (dueDate && /^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    const parts = dueDate.split('-').map(Number)
    year = parts[0]
    month = parts[1] - 1
    day = parts[2]
  } else if (dueDate && !isNaN(new Date(dueDate).getTime())) {
    const d = new Date(dueDate)
    year = d.getFullYear()
    month = d.getMonth()
    day = d.getDate()
  } else {
    const now = new Date()
    year = now.getFullYear()
    month = now.getMonth()
    day = now.getDate()
  }

  switch (recurrence) {
    case 'daily': {
      const next = new Date(year, month, day + 1)
      return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`
    }
    case 'weekly': {
      const next = new Date(year, month, day + 7)
      return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`
    }
    case 'monthly': {
      const nextMonth = month + 1
      const nextYear = nextMonth > 11 ? year + 1 : year
      const normalizedMonth = nextMonth % 12
      // Use the same day, but clamp to last day of month
      const maxDay = new Date(nextYear, normalizedMonth + 1, 0).getDate()
      const clampedDay = Math.min(day, maxDay)
      return `${nextYear}-${String(normalizedMonth + 1).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`
    }
    default:
      return null
  }
}
