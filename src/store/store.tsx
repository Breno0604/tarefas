import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef
} from 'react'
import { MOCK_STATE } from '../data/mock'
import { STATUS, PRIORITY, RECURRENCE, nextRecurrenceDate } from '../lib/constants'
import { PERSIST_VERSION, migrateState } from './migrations'
import { formatDate, localDateKey, todayKey, isPastDateKey } from '../lib/format'
import { getStorageAdapter } from '../lib/storage'
import type {
  AppState, AppAction, Task, Project, Category, Note, NotesMap,
  Activity, ActivityType, Reminder, TrashEntry, UserProfile,
  CreateTaskPayload, CompleteTaskResult, ReopenTaskResult,
  TaskStatus, TaskPriority, RecurrenceType, Subtask, StoreContextValue, Appearance
} from '../types'

export const StoreContext = createContext<StoreContextValue | null>(null as StoreContextValue | null)

const PERSIST_KEY = 'taskflow-state-v3'
const MAX_ACTIVITIES = 500

/** Generate a unique ID with an optional prefix. Uses crypto.randomUUID() when available. */
function uid(prefix: string = ''): string {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  return prefix ? `${prefix}-${id}` : id
}

function loadPersistedState(): Partial<AppState> | null {
  const storage = getStorageAdapter()
  try {
    const raw = storage.load(PERSIST_KEY)
    if (!raw) {
      // Try loading from old v2 key for migration
      const oldRaw = storage.load('taskflow-state-v2')
      if (oldRaw) {
        const oldSaved = JSON.parse(oldRaw)
        if (oldSaved.__v === 2) {
          const migrated = migrateState(oldSaved, 2)
          storage.save(PERSIST_KEY, JSON.stringify({ ...migrated, __v: PERSIST_VERSION }))
          storage.remove('taskflow-state-v2')
          return { ...migrated, booted: true } as Partial<AppState>
        }
      }
      return null
    }
    const saved = JSON.parse(raw)
    const savedVersion = saved.__v || 0
    if (!saved.me || !Array.isArray(saved.tasks)) {
      return null
    }
    // Run migrations if needed
    let migrated = saved
    if (savedVersion < PERSIST_VERSION) {
      migrated = migrateState(saved, savedVersion)
      migrated.__v = PERSIST_VERSION
      storage.save(PERSIST_KEY, JSON.stringify(migrated))
    }
    const { __v, ...rest } = migrated
    return { ...rest, booted: true }
  } catch {
    return null
  }
}

const DEFAULT_PREFS = {
  soundAlerts: false,
  compactMode: false
}

const DEFAULT_NOTIF_PREFS = {
  dueDates: true
}

const DEFAULT_APPEARANCE = {
  firstDay: (getStorageAdapter().load('taskflow-first-day') || 'sunday') as 'sunday' | 'monday'
}

const initialState = (): AppState => {
  const persisted = loadPersistedState()
  if (persisted) return {
    me: persisted.me || { id: 'me', name: 'Você', bio: '' } as UserProfile,
    tasks: persisted.tasks || [],
    projects: persisted.projects || [],
    categories: persisted.categories || [],
    notes: persisted.notes || {},
    activities: persisted.activities || [],
    reminders: persisted.reminders || [],
    trash: persisted.trash || [],
    theme: (getStorageAdapter().load('taskflow-theme') || 'light') as 'light' | 'dark',
    booted: true,
    prefs: { ...DEFAULT_PREFS, ...(persisted.prefs || {}) },
    notifPrefs: { ...DEFAULT_NOTIF_PREFS, ...(persisted.notifPrefs || {}) },
    appearance: { ...DEFAULT_APPEARANCE, ...(persisted.appearance || {}) }
  }
  return {
    me: MOCK_STATE.me || { id: 'me', name: 'Você', bio: '' } as UserProfile,
    tasks: MOCK_STATE.tasks || [],
    projects: MOCK_STATE.projects || [],
    categories: MOCK_STATE.categories || [],
    notes: MOCK_STATE.notes || {},
    activities: MOCK_STATE.activities || [],
    reminders: MOCK_STATE.reminders || [],
    trash: [],
    theme: (getStorageAdapter().load('taskflow-theme') || 'light') as 'light' | 'dark',
    booted: false,
    prefs: { ...DEFAULT_PREFS },
    notifPrefs: { ...DEFAULT_NOTIF_PREFS },
    appearance: { ...DEFAULT_APPEARANCE }
  }
}

export { initialState }

function activityEntry({ type, taskId, text }: { type: ActivityType; taskId: string | null; text: string }): Activity {
  return {
    id: uid('act'),
    type,
    taskId,
    text,
    createdAt: new Date().toISOString()
  }
}

/**
 * Normaliza a data de vencimento para 'YYYY-MM-DD' (local date key).
 * Evita o deslocamento de um dia em fusos negativos (UTC-x).
 * Valores inválidos resultam em null.
 */
function normalizeDueDate(value: string | null | undefined): string | null {
  if (!value) return null
  const s = String(value)
  // Already a date key — return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  // Try parsing ISO datetime or other formats
  const dt = new Date(s)
  if (isNaN(dt.getTime())) return null
  // Store as local date key to avoid timezone shifts
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const d = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Trim activities to MAX_ACTIVITIES, keeping the most recent ones. */
function trimActivities(activities: Activity[]): Activity[] {
  return activities.length > MAX_ACTIVITIES ? activities.slice(0, MAX_ACTIVITIES) : activities
}

function reminderEntry({ type, title, body, taskId }: { type: "due"; title: string; body: string; taskId: string }): Reminder {
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

function makeChangeActivities(task: Task, patch: Partial<Task> & Record<string, unknown>, projects: Project[]): Activity[] {
  const acts = []
  const old = task
  if (patch.status && patch.status !== old.status) {
    acts.push(
      activityEntry({
        type: 'status',
        taskId: old.id,
        text: `Você moveu "${old.title}" para ${STATUS[patch.status].label}`
      })
    )
  }
  if (patch.priority && patch.priority !== old.priority) {
    const dir = PRIORITY[patch.priority].rank > PRIORITY[old.priority].rank ? 'aumentou' : 'reduziu'
    acts.push(
      activityEntry({
        type: 'priority',
        taskId: old.id,
        text: `Você ${dir} a prioridade de "${old.title}" para ${PRIORITY[patch.priority].label}`
      })
    )
  }
  if ('dueDate' in patch && patch.dueDate !== old.dueDate) {
    acts.push(
      activityEntry({
        type: 'due',
        taskId: old.id,
        text: patch.dueDate
          ? `Você alterou o vencimento de "${old.title}" para ${formatDate(patch.dueDate)}`
          : `Você removeu o vencimento de "${old.title}"`
      })
    )
  }
  if ('projectId' in patch && patch.projectId !== old.projectId) {
    const p = (projects || []).find((pr) => pr.id === patch.projectId)
    acts.push(
      activityEntry({
        type: 'project',
        taskId: old.id,
        text: p
          ? `Você moveu "${old.title}" para o projeto ${p.name}`
          : `Você removeu "${old.title}" do projeto`
      })
    )
  }
  if (patch.title && patch.title !== old.title) {
    acts.push(
      activityEntry({
        type: 'title',
        taskId: old.id,
        text: `Você renomeou a tarefa "${old.title}" para "${patch.title}"`
      })
    )
  }
  return acts
}

export function validateTaskPayload(task: Partial<CreateTaskPayload> | Record<string, unknown>): string[] {
  const errors: string[] = []
  if (!task || typeof task !== 'object') return ['Payload inválido']
  if (task.title !== undefined && (!task.title || !String(task.title).trim())) {
    errors.push('Título é obrigatório')
  }
  if (task.estimatedHours !== undefined && (isNaN(Number(task.estimatedHours)) || Number(task.estimatedHours) < 0)) {
    errors.push('Horas estimadas deve ser um número não negativo')
  }
  if (task.dueDate && isNaN(new Date(task.dueDate as string).getTime())) {
    errors.push('Data de vencimento inválida')
  }
  return errors
}

/**
 * Cria a próxima ocorrência de uma tarefa recorrente recém-concluída.
 * A data base é sempre a data de conclusão (hoje), não a data original.
 * Se a próxima ocorrência ficar no passado (tarefa concluída com atraso),
 * ela é gerada a partir de hoje para nascer no futuro.
 */
function spawnRecurrence(state: AppState, task: Task): Task | null {
  if (!task.recurrence || !RECURRENCE[task.recurrence] || task.recurrence === 'none') return null
  // Use the task's due date as the base for the next occurrence
  const taskDateKey: string = localDateKey(task.dueDate) || todayKey()
  let nextDue: string | null = nextRecurrenceDate(taskDateKey, task.recurrence!)
  if (!nextDue) return null
  // If the next occurrence would be in the past (overdue task), base from today instead
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
    subtasks: (task.subtasks || []).map((s) => ({
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
 * All completion flows (button, kanban, batch, keyboard, context menu)
 * must route through this to ensure consistent behavior:
 * - status → done
 * - progress → 100
 * - spawn next recurrence if applicable
 * @returns {{ tasks, activities, spawned }}
 */
function completeTask(state: AppState, taskId: string): CompleteTaskResult {
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
 * @returns {{ tasks, activities }}
 */
function reopenTask(state: AppState, taskId: string): ReopenTaskResult {
  const idx = state.tasks.findIndex((t) => t.id === taskId)
  if (idx === -1) return { tasks: state.tasks, activities: state.activities }
  const task = state.tasks[idx]
  const tasks = state.tasks.slice()
  // Restore to 'todo' (safer default — user consciously moves to in_progress)
  tasks[idx] = { ...task, status: 'todo', progress: 0 }
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
 * Reconcilia lembretes: cria lembretes faltantes e remove obsoletos.
 * Idempotente — pode ser chamado repetidamente sem duplicar.
 */
function reconcileReminders(state: AppState): Reminder[] {
  const now = Date.now()
  const day: number = 24 * 60 * 60 * 1000
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
      if (taskDateKey < today) return false // now overdue, different reminder
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
      // Due today — no reminder needed (already visible on Today page)
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

/**
 * Normaliza e valida dados importados.
 * Preenche defaults, remove campos inválidos, corrige referências quebradas.
 */
function normalizeImportedData(d: Record<string, any>, currentState: AppState): Record<string, any> {
  const VALID_STATUS = new Set(['todo', 'in_progress', 'done', 'cancelled'])
  const VALID_PRIORITY = new Set(['low', 'medium', 'high', 'urgent'])
  const VALID_RECURRENCE = new Set(['none', 'daily', 'weekly', 'monthly'])

  const tasks = Array.isArray(d.tasks) ? d.tasks.map((t) => {
    if (!t || typeof t !== 'object') return null
    const id = t.id || uid('t')
    return {
      id,
      title: String(t.title || 'Sem título').trim(),
      description: String(t.description || ''),
      status: (VALID_STATUS.has(t.status) ? t.status : 'todo') as TaskStatus,
      priority: VALID_PRIORITY.has(t.priority) ? t.priority : 'medium',
      projectId: t.projectId || null,
      categoryId: t.categoryId || null,
      dueDate: t.dueDate || null,
      createdAt: t.createdAt || new Date().toISOString(),
      estimatedHours: Number(t.estimatedHours) || 0,
      progress: Math.max(0, Math.min(100, Number(t.progress) || 0)),
      tags: Array.isArray(t.tags) ? t.tags.filter((tag: unknown) => typeof tag === 'string') : [],
      subtasks: Array.isArray(t.subtasks) ? t.subtasks.map((s: Record<string, unknown>) => ({
        id: s?.id || uid('s'),
        title: String(s?.title || ''),
        done: Boolean(s?.done)
      })) : [],
      favorite: Boolean(t.favorite),
      recurrence: VALID_RECURRENCE.has(t.recurrence) ? t.recurrence : null,
      cancelReason: t.cancelReason || null
    }
  }).filter(Boolean as unknown as (x: unknown) => x is Task) : currentState.tasks

  const projects: Project[] = Array.isArray(d.projects) ? d.projects.map((p: Record<string, unknown>) => {
    if (!p || typeof p !== 'object') return null
    return {
      id: p.id || uid('p'),
      name: String(p.name || 'Sem nome').trim(),
      description: String(p.description || ''),
      color: typeof p.color === 'string' ? p.color : '#6366f1',
      due: p.due || null
    }
  }).filter(Boolean as unknown as (x: unknown) => x is Project) : currentState.projects

  const categories: Category[] = Array.isArray(d.categories) ? d.categories.map((c: Record<string, unknown>) => {
    if (!c || typeof c !== 'object') return null
    return {
      id: c.id || uid('c'),
      name: String(c.name || 'Sem nome').trim(),
      color: typeof c.color === 'string' ? c.color : '#94a3b8'
    }
  }).filter(Boolean as any) : currentState.categories

  // Fix broken project/category references
  const projectIds = new Set(projects.map((p) => p.id))
  const categoryIds = new Set(categories.map((c) => c.id))
  const cleanedTasks = tasks.map((t) => ({
    ...t,
    projectId: t.projectId && projectIds.has(t.projectId) ? t.projectId : null,
    categoryId: t.categoryId && categoryIds.has(t.categoryId) ? t.categoryId : null
  }))

  // Normalize notes: only replace if imported data has actual notes content
  const notes = d.notes && typeof d.notes === 'object' && !Array.isArray(d.notes) && Object.keys(d.notes).length > 0
    ? (d.notes as NotesMap)
    : currentState.notes

  // Normalize activities
  const activities = Array.isArray(d.activities)
    ? d.activities.filter((a) => a && typeof a === 'object' && a.id)
    : currentState.activities

  return {
    me: d.me && typeof d.me === 'object' ? { ...currentState.me, ...d.me } : currentState.me,
    tasks: cleanedTasks,
    projects,
    categories,
    notes,
    activities: trimActivities(activities),
    trash: Array.isArray(d.trash) ? d.trash : currentState.trash,
    theme: d.theme || currentState.theme,
    appearance: d.appearance ? { ...currentState.appearance, ...d.appearance } as Appearance : currentState.appearance,
    prefs: d.prefs ? { ...currentState.prefs, ...d.prefs } : currentState.prefs,
    notifPrefs: d.notifPrefs ? { ...currentState.notifPrefs, ...d.notifPrefs } : currentState.notifPrefs
  }
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'BOOT': {
      const day = 24 * 60 * 60 * 1000
      // Trash retention: clear entries deleted more than 30 days ago
      const trash = (state.trash || []).filter(
        (e) => !e.deletedAt || Date.now() - new Date(e.deletedAt).getTime() < 30 * day
      )
      const reminders = reconcileReminders(state)
      return { ...state, booted: true, reminders, trash }
    }
    case 'RECONCILE_REMINDERS': {
      const reminders = reconcileReminders(state)
      return { ...state, reminders }
    }
    case 'SET_THEME': {
      return { ...state, theme: action.theme }
    }
    case 'UPDATE_PREFS': {
      return { ...state, prefs: { ...(state.prefs || {}), ...action.prefs } }
    }
    case 'UPDATE_NOTIF_PREFS': {
      return { ...state, notifPrefs: { ...(state.notifPrefs || {}), ...action.notifPrefs } }
    }
    case 'UPDATE_APPEARANCE': {
      return { ...state, appearance: { ...(state.appearance || {}), ...action.appearance } }
    }
    case 'UPDATE_ME': {
      return {
        ...state,
        me: { ...(state.me || { id: 'me', name: 'Você', bio: '' }), ...action.patch }
      }
    }
    case 'CREATE_TASK': {
      const validationErrors = validateTaskPayload(action.task)
      if (validationErrors.length > 0) return state
      const task = {
        id: uid('t'),
        title: action.task.title,
        description: action.task.description || '',
        status: action.task.status || 'todo',
        priority: action.task.priority || 'medium',
        projectId: action.task.projectId || null,
        categoryId: action.task.categoryId || null,
        dueDate: normalizeDueDate(action.task.dueDate),
        createdAt: new Date().toISOString(),
        estimatedHours: Number(action.task.estimatedHours) || 0,
        progress: 0,
        tags: action.task.tags || [],
        subtasks: action.task.subtasks || [],
        favorite: Boolean(action.task.favorite),
        recurrence: action.task.recurrence || null,
        cancelReason: null
      }
      const acts = [
        activityEntry({
          type: 'create',
          taskId: task.id,
          text: `Você criou a tarefa "${task.title}"`
        })
      ]
      return {
        ...state,
        tasks: [task, ...state.tasks],
        activities: trimActivities([...acts, ...state.activities])
      }
    }
    case 'UPDATE_TASK': {
      if (action.patch) {
        const patchErrors = validateTaskPayload(action.patch)
        if (patchErrors.length > 0) return state
      }
      const idx = state.tasks.findIndex((t) => t.id === action.taskId)
      if (idx === -1) return state
      const old = state.tasks[idx]
      // If patch sets status to 'done', route through completeTask
      if (action.patch?.status === 'done' && old.status !== 'done') {
        const result = completeTask(state, old.id)
        // Apply remaining patch fields (non-status) on top
        if (action.patch && Object.keys(action.patch).length > 1) {
          const remainingPatch = { ...action.patch }
          delete remainingPatch.status
          delete remainingPatch.progress
          const taskIdx = result.tasks.findIndex((t) => t.id === old.id)
          if (taskIdx !== -1) {
            result.tasks[taskIdx] = { ...result.tasks[taskIdx], ...remainingPatch }
          }
        }
        return { ...state, tasks: result.tasks, activities: result.activities }
      }
      // If patch moves from 'done' to another status, route through reopenTask
      if (old.status === 'done' && action.patch?.status && action.patch.status !== 'done') {
        const result = reopenTask(state, old.id)
        const taskIdx = result.tasks.findIndex((t) => t.id === old.id)
        if (taskIdx !== -1) {
          const remainingPatch = { ...action.patch }
          delete remainingPatch.status
          result.tasks[taskIdx] = { ...result.tasks[taskIdx], ...remainingPatch, status: action.patch.status }
        }
        return { ...state, tasks: result.tasks, activities: result.activities }
      }
      // Simple update (no status change to/from done)
      const next = { ...old, ...action.patch }
      const tasks = state.tasks.slice()
      tasks[idx] = next
      const acts = makeChangeActivities(old, action.patch, state.projects)
      return {
        ...state,
        tasks,
        activities: trimActivities([...acts, ...state.activities])
      }
    }
    case 'TOGGLE_TASK_DONE': {
      const task = state.tasks.find((t) => t.id === action.taskId)
      if (!task) return state
      if (task.status === 'done') {
        // Reabrir — use domain function
        const result = reopenTask(state, task.id)
        return { ...state, tasks: result.tasks, activities: result.activities }
      }
      // Concluir — use unified domain function
      const result = completeTask(state, task.id)
      return { ...state, tasks: result.tasks, activities: result.activities }
    }
    case 'COMPLETE_TASK': {
      const task = state.tasks.find((t) => t.id === action.taskId)
      if (!task || task.status === 'done' || task.status === 'cancelled') return state
      const result = completeTask(state, task.id)
      return { ...state, tasks: result.tasks, activities: result.activities }
    }
    case 'REOPEN_TASK': {
      const task = state.tasks.find((t) => t.id === action.taskId)
      if (!task || task.status !== 'done') return state
      const result = reopenTask(state, task.id)
      return { ...state, tasks: result.tasks, activities: result.activities }
    }
    case 'SET_TASK_STATUS': {
      const task = state.tasks.find((t) => t.id === action.taskId)
      if (!task) return state
      const newStatus = action.status
      if (!STATUS[newStatus]) return state
      // If moving to done, use the completeTask domain function
      if (newStatus === 'done') {
        const result = completeTask(state, task.id)
        return { ...state, tasks: result.tasks, activities: result.activities }
      }
      // If moving away from done to another status, just update
      if (task.status === 'done') {
        const result = reopenTask(state, task.id)
        // If newStatus is not in_progress, override after reopen
        if (newStatus !== 'in_progress') {
          const idx = result.tasks.findIndex((t) => t.id === task.id)
          if (idx !== -1) {
            result.tasks[idx] = { ...result.tasks[idx], status: newStatus }
          }
        }
        return { ...state, tasks: result.tasks, activities: result.activities }
      }
      // Simple status change
      const acts = [
        activityEntry({
          type: 'status',
          taskId: task.id,
          text: `Você moveu "${task.title}" para ${STATUS[newStatus].label}`
        })
      ]
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)),
        activities: trimActivities([...acts, ...state.activities])
      }
    }
    case 'CANCEL_TASK': {
      const task = state.tasks.find((t) => t.id === action.taskId)
      if (
        !task ||
        task.status === 'done' ||
        task.status === 'cancelled'
      ) {
        return state
      }
      const reason = action.reason ? action.reason.trim() : ''
      const next: Task = { ...task, status: 'cancelled' as TaskStatus, ...(reason ? { cancelReason: reason } : {}) }
      const actText = reason
        ? `Você cancelou "${task.title}": "${reason}"`
        : `Você cancelou "${task.title}"`
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === task.id ? next : t)),
        activities: [activityEntry({ type: 'cancel', taskId: task.id, text: actText }), ...state.activities]
      }
    }
    case 'DELETE_TASK': {
      const task = state.tasks.find((t) => t.id === action.taskId)
      if (!task) return state
      const acts = [
        activityEntry({
          type: 'delete',
          taskId: null,
          text: `Você excluiu a tarefa "${task.title}"`
        })
      ]
      // Capture notes BEFORE any mutation — state.notes references are shared
      const taskNotes = state.notes[action.taskId!] || []
      const notes = { ...state.notes }
      delete notes[action.taskId]
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.taskId),
        notes,
        activities: trimActivities([...acts, ...state.activities]),
        trash: [
          ...state.trash,
          { task, notes: taskNotes, deletedAt: new Date().toISOString() }
        ]
      }
    }
    case 'RESTORE_TASK': {
      const ids: Set<string> = 'taskIds' in action && Array.isArray(action.taskIds) && action.taskIds.length > 0
        ? new Set(action.taskIds)
        : 'taskId' in action && action.taskId
          ? new Set([action.taskId])
          : new Set()
          
      const restored = state.trash.filter((entry) => !ids || ids.has(entry.task.id))
      if (restored.length === 0) return state
      const restoredIds = new Set(restored.map((r) => r.task.id))
      const notes = { ...state.notes }
      restored.forEach((r) => {
        notes[r.task.id] = r.notes
      })
      const acts = restored.map((r) =>
        activityEntry({
          type: 'restore',
          taskId: r.task.id,
          text: `Você restaurou a tarefa "${r.task.title}"`
        })
      )
      return {
        ...state,
        tasks: [...restored.map((r) => r.task), ...state.tasks],
        notes,
        trash: state.trash.filter((entry) => !restoredIds.has(entry.task.id)),
        activities: trimActivities([...acts, ...state.activities])
      }
    }
    case 'TOGGLE_FAVORITE': {
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId ? { ...t, favorite: !t.favorite } : t
        )
      }
    }
    case 'DUPLICATE_TASK': {
      const source = state.tasks.find((t) => t.id === action.taskId)
      if (!source) return state
      const newId = uid('t')
      const copy = {
        ...source,
        id: newId,
        title: `${source.title} (cópia)`,
        createdAt: new Date().toISOString(),
        status: 'todo' as TaskStatus,
        progress: 0,
        subtasks: (source.subtasks || []).map((s) => ({
          ...s,
          id: uid('s'),
          done: false
        }))
      }
      const acts = [
        activityEntry({
          type: 'create',
          taskId: copy.id,
          text: `Você duplicou a tarefa "${source.title}" para "${copy.title}"`
        })
      ]
      // Store the new task ID so consumers can reference it (e.g. for undo)
      return {
        ...state,
        tasks: [copy, ...state.tasks],
        activities: trimActivities([...acts, ...state.activities]),
        _lastDuplicatedId: newId
      }
    }
    case 'TOGGLE_SUBTASK': {
      const target = state.tasks.find((t) => t.id === action.taskId)
      if (!target) return state
      return {
        ...state,
        tasks: state.tasks.map((t) => {
          if (t.id !== action.taskId) return t
          const subtasks = t.subtasks.map((s) =>
            s.id === action.subtaskId ? { ...s, done: !s.done } : s
          )
          if (subtasks.length === 0) return { ...t, subtasks }
          const doneCount = subtasks.filter((s) => s.done).length
          return { ...t, subtasks, progress: Math.round((doneCount / subtasks.length) * 100) }
        })
      }
    }
    case 'ADD_NOTE': {
      const task = state.tasks.find((t) => t.id === action.taskId)
      if (!task || !String(action.text || '').trim()) return state
      const note = {
        id: uid('n'),
        text: String(action.text).trim(),
        createdAt: new Date().toISOString()
      }
      const acts = [
        activityEntry({
          type: 'note',
          taskId: action.taskId,
          text: `Você anotou algo em "${task.title}"`
        })
      ]
      return {
        ...state,
        notes: {
          ...state.notes,
          [action.taskId]: [...(state.notes[action.taskId!] || []), note]
        },
        activities: trimActivities([...acts, ...state.activities])
      }
    }
    case 'DELETE_NOTE': {
      const list = state.notes[action.taskId!]
      if (!list || !list.some((n) => n.id === action.noteId)) return state
      return {
        ...state,
        notes: {
          ...state.notes,
          [action.taskId]: list.filter((n) => n.id !== action.noteId)
        }
      }
    }
    case 'MARK_REMINDER_READ': {
      return {
        ...state,
        reminders: state.reminders.map((r) =>
          r.id === action.id ? { ...r, read: true } : r
        )
      }
    }
    case 'MARK_ALL_REMINDERS_READ': {
      return {
        ...state,
        reminders: state.reminders.map((r) => ({ ...r, read: true }))
      }
    }
    case 'CLEAR_REMINDERS': {
      return { ...state, reminders: [] }
    }
    case 'CREATE_PROJECT': {
      const project = {
        id: uid('p'),
        name: action.name,
        description: action.description || '',
        color: action.color || '#6366f1',
        due: action.due ? normalizeDueDate(action.due) : null
      }
      const acts = [
        activityEntry({
          type: 'project',
          taskId: null,
          text: `Você criou o projeto "${project.name}"`
        })
      ]
      return {
        ...state,
        projects: [...state.projects, project],
        activities: trimActivities([...acts, ...state.activities])
      }
    }
    case 'CREATE_CATEGORY': {
      const category = {
        id: uid('c'),
        name: action.name,
        color: action.color || '#94a3b8'
      }
      const acts = [
        activityEntry({
          type: 'category',
          taskId: null,
          text: `Você criou a categoria "${category.name}"`
        })
      ]
      return {
        ...state,
        categories: [...state.categories, category],
        activities: trimActivities([...acts, ...state.activities])
      }
    }
    case 'IMPORT_DATA': {
      const d = action.data || {}
      const normalized = normalizeImportedData(d, state)
      return {
        ...state,
        ...normalized,
        // Always reconcile reminders after import
        reminders: reconcileReminders({ ...state, ...normalized })
      }
    }
    case 'TOGGLE_ARCHIVE': {
      const idx = state.tasks.findIndex((t) => t.id === action.taskId)
      if (idx === -1) return state
      const task = state.tasks[idx]
      const tasks = state.tasks.slice()
      tasks[idx] = { ...task, archived: !task.archived }
      return {
        ...state,
        tasks,
        activities: trimActivities([
          activityEntry({
            type: 'status',
            taskId: task.id,
            text: task.archived ? `Você arquivou "${task.title}"` : `Você desarquivou "${task.title}"`
          }),
          ...state.activities
        ])
      }
    }
    case 'CLEAR_TRASH': {
      return { ...state, trash: [] }
    }
    case 'RESET': {
      return { ...initialState(), booted: true }
    }
    case 'EDIT_CATEGORY': {
      const idx = state.categories.findIndex((c) => c.id === action.categoryId)
      if (idx === -1) return state
      const updated = state.categories.slice()
      updated[idx] = { ...updated[idx], name: action.name, color: action.color }
      return {
        ...state,
        categories: updated,
        activities: trimActivities([
          activityEntry({ type: 'category', taskId: null, text: 'Voce editou a categoria "' + action.name + '"' }),
          ...state.activities
        ])
      }
    }
    case 'DELETE_CATEGORY': {
      const cat = state.categories.find((c) => c.id === action.categoryId)
      if (!cat) return state
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.categoryId),
        tasks: state.tasks.map((t) =>
          t.categoryId === action.categoryId ? { ...t, categoryId: null } : t
        ),
        activities: trimActivities([
          activityEntry({ type: 'category', taskId: null, text: 'Voce excluiu a categoria "' + cat.name + '" - tarefas mantidas sem categoria' }),
          ...state.activities
        ])
      }
    }
    case 'EDIT_PROJECT': {
      const pidx = state.projects.findIndex((p) => p.id === action.projectId)
      if (pidx === -1) return state
      const projs = state.projects.slice()
      projs[pidx] = { ...projs[pidx], name: action.name, description: action.description, color: action.color, due: action.due || null }
      return {
        ...state,
        projects: projs,
        activities: trimActivities([
          activityEntry({ type: 'project', taskId: null, text: 'Voce editou o projeto "' + action.name + '"' }),
          ...state.activities
        ])
      }
    }
    case 'DELETE_PROJECT': {
      const proj = state.projects.find((p) => p.id === action.projectId)
      if (!proj) return state
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== action.projectId),
        tasks: state.tasks.map((t) =>
          t.projectId === action.projectId ? { ...t, projectId: null } : t
        ),
        activities: trimActivities([
          activityEntry({ type: 'project', taskId: null, text: 'Voce excluiu o projeto "' + proj.name + '" - tarefas mantidas sem projeto' }),
          ...state.activities
        ])
      }
    }
    case 'DELETE_ACTIVITY': {
      const id = action.activityId
      if (!id) return state
      return {
        ...state,
        activities: state.activities.filter((a: any) => a.id !== id)
      }
    }
    default:
      return state
  }
}

export { reducer }

export function StoreProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const prevDayRef = useRef<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => dispatch({ type: 'BOOT' }), 50)
    return () => clearTimeout(t)
  }, [])

  // Real-time clock: reconcile reminders and detect day transitions
  useEffect(() => {
    if (!state.booted) return
    prevDayRef.current = todayKey()

    const reconcile = () => {
      const currentDay = todayKey()
      if (currentDay !== prevDayRef.current) {
        prevDayRef.current = currentDay
      }
      dispatch({ type: 'RECONCILE_REMINDERS' })
    }

    // Reconcile every 60 seconds
    const intervalId = setInterval(reconcile, 60_000)

    // Reconcile when tab becomes visible again
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') reconcile()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    // Reconcile when window regains focus
    const onFocus = () => reconcile()
    window.addEventListener('focus', onFocus)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', onFocus)
    }
  }, [state.booted])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark')
    getStorageAdapter().save('taskflow-theme', state.theme)
  }, [state.theme])

  useEffect(() => {
    if (!state.booted) return
    const t = setTimeout(() => {
      try {
        const { _lastDuplicatedId, ...persisted } = state
        getStorageAdapter().save(PERSIST_KEY, JSON.stringify({ ...persisted, __v: PERSIST_VERSION }))
      } catch (e) {
        console.warn('[TaskFlow] Não foi possível salvar:', (e as Error)?.message || e)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [state])

  const value = useMemo<StoreContextValue>(() => ({ state, dispatch }), [state])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore deve ser usado dentro de StoreProvider')
  return ctx
}

export function useMe(): UserProfile {
  const { state } = useStore()
  return state.me || { id: 'me', name: 'Você', bio: '' }
}

export function useTaskById(taskId: string | null | undefined): Task | undefined {
  const { state } = useStore()
  return useMemo(() => state.tasks.find((t) => t.id === taskId), [state.tasks, taskId])
}

export function useTaskNotes(taskId: string | null | undefined): Note[] {
  const { state } = useStore()
  return useMemo(() => (taskId ? state.notes[taskId] : []) || [], [state.notes, taskId])
}
