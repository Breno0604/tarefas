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
 * @param {string|null} dueDate Data base (ISO). Se nula, usa agora.
 * @param {'daily'|'weekly'|'monthly'} recurrence
 * @returns {string} ISO string
 */
export function nextRecurrenceDate(dueDate, recurrence) {
  const base = dueDate && !isNaN(new Date(dueDate).getTime()) ? new Date(dueDate) : new Date()
  const next = new Date(base.getTime())
  switch (recurrence) {
    case 'daily':
      next.setDate(next.getDate() + 1)
      break
    case 'weekly':
      next.setDate(next.getDate() + 7)
      break
    case 'monthly':
      next.setMonth(next.getMonth() + 1)
      break
    default:
      return null
  }
  return next.toISOString()
}
