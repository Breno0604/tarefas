/**
 * Task domain logic — extracted from store.tsx for reuse.
 *
 * This module contains pure functions that operate on task data.
 * No React, no state, no side effects — just business rules.
 *
 * When migrating to Convex, these functions become the basis for
 * server-side mutations (with slight adaptation for Convex's ctx).
 */

import { RECURRENCE, nextRecurrenceDate } from '../lib/constants'
import { formatDate, localDateKey, todayKey, isPastDateKey } from '../lib/format'
import type {
  AppState, Task, Project, Activity, ActivityType,
  CreateTaskPayload, CompleteTaskResult, ReopenTaskResult,
  TaskStatus, TaskPriority, RecurrenceType, Subtask,
} from '../types'

/** Generate a unique ID with an optional prefix. */
export function uid(prefix: string = ''): string {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  return prefix ? `${prefix}-${id}` : id
}

/** Create an activity entry. */
export function activityEntry({ type, taskId, text }: { type: ActivityType; taskId: string | null; text: string }): Activity {
  return {
    id: uid('act'),
    type,
    taskId,
    text,
    createdAt: new Date().toISOString()
  }
}

/**
 * Normalize a due date to 'YYYY-MM-DD' (local date key).
 * Avoids timezone shifts from toISOString().
 */
export function normalizeDueDate(value: string | null | undefined): string | null {
  if (!value) return null
  const s = String(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const dt = new Date(s)
  if (isNaN(dt.getTime())) return null
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const d = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Trim activities to MAX_ACTIVITIES, keeping the most recent ones. */
export function trimActivities(activities: Activity[], max: number = 500): Activity[] {
  return activities.length > max ? activities.slice(0, max) : activities
}

/** Validate a task creation/update payload. Returns array of error messages. */
export function validateTaskPayload(task: Partial<CreateTaskPayload> | Record<string, any>): string[] {
  const errors: string[] = []
  if (!task || typeof task !== 'object') return ['Payload inválido']
  if (task.title !== undefined && (!task.title || !String(task.title).trim())) {
    errors.push('Título é obrigatório')
  }
  if (task.estimatedHours !== undefined && (isNaN(Number(task.estimatedHours)) || Number(task.estimatedHours) < 0)) {
    errors.push('Horas estimadas deve ser um número não negativo')
  }
  if (task.dueDate && isNaN(new Date(String(task.dueDate)).getTime())) {
    errors.push('Data de vencimento inválida')
  }
  return errors
}

/**
 * Create a task from a payload with defaults applied.
 */
export function createTaskFromPayload(payload: CreateTaskPayload): Task {
  return {
    id: uid('t'),
    title: payload.title,
    description: payload.description || '',
    status: payload.status || 'todo',
    priority: payload.priority || 'medium',
    projectId: payload.projectId || null,
    categoryId: payload.categoryId || null,
    dueDate: normalizeDueDate(payload.dueDate),
    createdAt: new Date().toISOString(),
    estimatedHours: Number(payload.estimatedHours) || 0,
    progress: 0,
    tags: payload.tags || [],
    subtasks: payload.subtasks || [],
    favorite: Boolean(payload.favorite),
    recurrence: payload.recurrence || null,
    cancelReason: null,
  }
}

/**
 * Spawn the next occurrence of a recurring task.
 * Base date is always today (completion date), not the original due date.
 * If the next occurrence would be in the past, it's generated from today.
 */
export function spawnRecurrence(state: AppState, task: Task): Task | null {
  if (!task.recurrence || !RECURRENCE[task.recurrence] || task.recurrence === 'none') return null
  const taskDateKey: string = localDateKey(task.dueDate) || todayKey()
  let nextDue: string | null = nextRecurrenceDate(taskDateKey, task.recurrence!)
  if (!nextDue) return null
  if (isPastDateKey(nextDue)) {
    nextDue = nextRecurrenceDate(todayKey(), task.recurrence)
  }
  if (!nextDue || isPastDateKey(nextDue)) return null
  return {
    id: uid('t'),
    title: task.title,
    description: task.description,
    status: 'todo' as TaskStatus,
    priority: task.priority,
    projectId: task.projectId || null,
    categoryId: task.categoryId || null,
    dueDate: nextDue,
    createdAt: new Date().toISOString(),
    estimatedHours: task.estimatedHours || 0,
    progress: 0,
    tags: [...(task.tags || [])],
    subtasks: (task.subtasks || []).map((s: Subtask) => ({
      ...s,
      id: uid('s'),
      done: false
    })),
    favorite: false,
    recurrence: task.recurrence,
    cancelReason: null
  }
}

/**
 * Domain function: mark a task as complete.
 * All completion flows must route through this.
 */
export function completeTask(state: AppState, taskId: string): CompleteTaskResult {
  const idx = state.tasks.findIndex((t) => t.id === taskId)
  if (idx === -1) return { tasks: state.tasks, activities: state.activities, spawned: null }
  const task = state.tasks[idx]
  const tasks = state.tasks.slice()
  tasks[idx] = { ...task, status: 'done', progress: 100 }
  const spawned = spawnRecurrence(state, task)
  const acts = [
    activityEntry({
      type: 'status',
      taskId: task.id,
      text: `Você concluiu "${task.title}"`
    })
  ]
  if (spawned) {
    acts.unshift(
      activityEntry({
        type: 'create',
        taskId: spawned.id,
        text: `Próxima ocorrência de "${task.title}" criada para ${formatDate(spawned.dueDate)}`
      })
    )
  }
  return {
    tasks: spawned ? [spawned, ...tasks] : tasks,
    activities: trimActivities([...acts, ...state.activities]),
    spawned
  }
}

/**
 * Domain function: reopen a task that was done.
 */
export function reopenTask(state: AppState, taskId: string): ReopenTaskResult {
  const idx = state.tasks.findIndex((t) => t.id === taskId)
  if (idx === -1) return { tasks: state.tasks, activities: state.activities }
  const task = state.tasks[idx]
  const tasks = state.tasks.slice()
  tasks[idx] = { ...task, status: 'in_progress', progress: Math.min(task.progress || 0, 99) }
  return {
    tasks,
    activities: [
      activityEntry({
        type: 'status',
        taskId: task.id,
        text: `Você reabriu "${task.title}"`
      }),
      ...state.activities
    ]
  }
}

/**
 * Generate change activities for a task update.
 */
export function makeChangeActivities(task: Task, patch: Partial<Task> & Record<string, unknown>, projects: Project[]): Activity[] {
  const acts: Activity[] = []
  const old = task
  if (patch.status && patch.status !== old.status) {
    const STATUS_LABELS: Record<string, string> = {
      todo: 'A fazer', in_progress: 'Em andamento', done: 'Concluída', cancelled: 'Cancelada'
    }
    acts.push(activityEntry({
      type: 'status',
      taskId: old.id,
      text: `Você moveu "${old.title}" para ${STATUS_LABELS[patch.status as string] || patch.status}`
    }))
  }
  if (patch.priority && patch.priority !== old.priority) {
    const PRIORITY_LABELS: Record<string, string> = {
      low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente'
    }
    const PRIORITY_RANK: Record<string, number> = { low: 0, medium: 1, high: 2, urgent: 3 }
    const dir = (PRIORITY_RANK[patch.priority as string] || 0) > (PRIORITY_RANK[old.priority] || 0) ? 'aumentou' : 'reduziu'
    acts.push(activityEntry({
      type: 'priority',
      taskId: old.id,
      text: `Você ${dir} a prioridade de "${old.title}" para ${PRIORITY_LABELS[patch.priority as string] || patch.priority}`
    }))
  }
  if ('dueDate' in patch && patch.dueDate !== old.dueDate) {
    acts.push(activityEntry({
      type: 'due',
      taskId: old.id,
      text: patch.dueDate
        ? `Você alterou o vencimento de "${old.title}" para ${formatDate(patch.dueDate as string)}`
        : `Você removeu o vencimento de "${old.title}"`
    }))
  }
  if ('projectId' in patch && patch.projectId !== old.projectId) {
    const p = (projects || []).find((pr) => pr.id === patch.projectId)
    acts.push(activityEntry({
      type: 'project',
      taskId: old.id,
      text: p
        ? `Você moveu "${old.title}" para o projeto ${p.name}`
        : `Você removeu "${old.title}" do projeto`
    }))
  }
  if (patch.title && patch.title !== old.title) {
    acts.push(activityEntry({
      type: 'title',
      taskId: old.id,
      text: `Você renomeou a tarefa "${old.title}" para "${patch.title}"`
    }))
  }
  return acts
}
