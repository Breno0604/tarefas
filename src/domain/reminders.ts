/**
 * Reminder domain logic — extracted from store.tsx.
 *
 * Reconciles reminders: creates missing ones and removes stale ones.
 * Idempotent — safe to call repeatedly without duplicates.
 */

import { localDateKey, todayKey } from '../lib/format'
import { uid } from './tasks'
import type { AppState, Reminder } from '../types'

/** Create a reminder entry. */
export function reminderEntry({ type, title, body, taskId }: { type: 'due'; title: string; body: string; taskId: string }): Reminder {
  return {
    id: uid('rem'),
    type,
    title,
    body,
    taskId,
    read: false,
    createdAt: new Date().toISOString()
  }
}

/**
 * Reconcile reminders: create missing ones and remove stale ones.
 * Idempotent — can be called repeatedly without duplicating.
 */
export function reconcileReminders(state: AppState): Reminder[] {
  const day = 24 * 60 * 60 * 1000
  const taskIds = new Set(state.tasks.map((t) => t.id))
  const today = todayKey()

  // Start with current reminders, removing orphans and stale ones
  let reminders = state.reminders.filter((r) => {
    if (!r.taskId || !taskIds.has(r.taskId)) return false
    const task = state.tasks.find((t) => t.id === r.taskId)
    if (!task || task.status === 'done' || task.status === 'cancelled') return false
    if (!task.dueDate) return false
    const taskDateKey = localDateKey(task.dueDate)
    // Overdue reminder only valid while actually past due
    if (r.type === 'due' && r.title === 'Tarefa atrasada' && !(taskDateKey < today)) return false
    // Upcoming reminder only valid within 3-day window
    if (r.type === 'due' && r.title === 'Vencimento próximo') {
      if (taskDateKey < today) return false
      const taskDate = new Date(taskDateKey)
      const todayDate = new Date(today)
      const diffDays = Math.round((taskDate.getTime() - todayDate.getTime()) / day)
      if (diffDays > 3 || diffDays < 0) return false
    }
    return true
  })

  const has = (type: string, taskId: string) =>
    reminders.some((r) => r.type === type && r.taskId === taskId)

  // Create missing reminders using calendar date comparison
  state.tasks.forEach((t) => {
    if (!t.dueDate || t.status === 'done' || t.status === 'cancelled') return
    const taskDateKey = localDateKey(t.dueDate)
    if (taskDateKey < today) {
      // Overdue
      if (!has('due', t.id)) {
        reminders.push(
          reminderEntry({
            type: 'due',
            title: 'Tarefa atrasada',
            body: `"${t.title}" está atrasada.`,
            taskId: t.id
          })
        )
      }
    } else if (taskDateKey === today) {
      // Due today — no reminder needed
    } else if (state.notifPrefs?.dueDates !== false) {
      // Due in the future — check if within 3-day window
      const taskDate = new Date(taskDateKey)
      const todayDate = new Date(today)
      const diffDays = Math.round((taskDate.getTime() - todayDate.getTime()) / day)
      if (diffDays <= 3 && !has('due', t.id)) {
        const body = diffDays === 1
          ? `"${t.title}" vence amanhã.`
          : `"${t.title}" vence em ${diffDays} dia(s).`
        reminders.push(
          reminderEntry({
            type: 'due',
            title: 'Vencimento próximo',
            body,
            taskId: t.id
          })
        )
      }
    }
  })

  return reminders
}
