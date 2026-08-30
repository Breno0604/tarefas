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
import { formatDate, localDateKey, todayKey, isPastDateKey } from '../lib/format'

const StoreContext = createContext(null)

const PERSIST_KEY = 'taskflow-state-v2'
const PERSIST_VERSION = 2
const MAX_ACTIVITIES = 500

/** Generate a unique ID with an optional prefix. Uses crypto.randomUUID() when available. */
function uid(prefix = '') {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  return prefix ? `${prefix}-${id}` : id
}

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(PERSIST_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw)
    if (
      saved.__v !== PERSIST_VERSION ||
      !saved.me ||
      !Array.isArray(saved.tasks) ||
      !Array.isArray(saved.projects) ||
      !Array.isArray(saved.categories)
    ) {
      return null
    }
    const { __v, ...rest } = saved
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
  firstDay: localStorage.getItem('taskflow-first-day') || 'sunday'
}

const initialState = () => {
  const persisted = loadPersistedState()
  if (persisted) return {
    ...persisted,
    prefs: { ...DEFAULT_PREFS, ...(persisted.prefs || {}) },
    notifPrefs: { ...DEFAULT_NOTIF_PREFS, ...(persisted.notifPrefs || {}) },
    appearance: { ...DEFAULT_APPEARANCE, ...(persisted.appearance || {}) }
  }
  return {
    ...MOCK_STATE,
    theme: localStorage.getItem('taskflow-theme') || 'light',
    booted: false,
    trash: [],
    prefs: { ...DEFAULT_PREFS },
    notifPrefs: { ...DEFAULT_NOTIF_PREFS },
    appearance: { ...DEFAULT_APPEARANCE }
  }
}

export { initialState }

function activityEntry({ type, taskId, text }) {
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
function normalizeDueDate(value) {
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
function trimActivities(activities) {
  return activities.length > MAX_ACTIVITIES ? activities.slice(0, MAX_ACTIVITIES) : activities
}

function reminderEntry({ type, title, body, taskId }) {
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

function makeChangeActivities(task, patch, projects) {
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

export function validateTaskPayload(task) {
  const errors = []
  if (!task || typeof task !== 'object') return ['Payload inválido']
  if (task.title !== undefined && (!task.title || !String(task.title).trim())) {
    errors.push('Título é obrigatório')
  }
  if (task.estimatedHours !== undefined && (isNaN(task.estimatedHours) || Number(task.estimatedHours) < 0)) {
    errors.push('Horas estimadas deve ser um número não negativo')
  }
  if (task.dueDate && isNaN(new Date(task.dueDate).getTime())) {
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
function spawnRecurrence(state, task) {
  if (!RECURRENCE[task.recurrence] || task.recurrence === 'none') return null
  // Use the task's due date as the base for the next occurrence
  const taskDateKey = localDateKey(task.dueDate) || todayKey()
  let nextDue = nextRecurrenceDate(taskDateKey, task.recurrence)
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
    status: 'todo',
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
function completeTask(state, taskId) {
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
function reopenTask(state, taskId) {
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
 * Reconcilia lembretes: cria lembretes faltantes e remove obsoletos.
 * Idempotente — pode ser chamado repetidamente sem duplicar.
 */
function reconcileReminders(state) {
  const now = Date.now()
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
      if (taskDateKey < today) return false // now overdue, different reminder
      const taskDate = new Date(taskDateKey)
      const todayDate = new Date(today)
      const diffDays = Math.round((taskDate - todayDate) / day)
      if (diffDays > 3 || diffDays < 0) return false
    }
    return true
  })

  const has = (type, taskId) =>
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
      const diffDays = Math.round((taskDate - todayDate) / day)
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
function normalizeImportedData(d, currentState) {
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
      status: VALID_STATUS.has(t.status) ? t.status : 'todo',
      priority: VALID_PRIORITY.has(t.priority) ? t.priority : 'medium',
      projectId: t.projectId || null,
      categoryId: t.categoryId || null,
      dueDate: t.dueDate || null,
      createdAt: t.createdAt || new Date().toISOString(),
      estimatedHours: Number(t.estimatedHours) || 0,
      progress: Math.max(0, Math.min(100, Number(t.progress) || 0)),
      tags: Array.isArray(t.tags) ? t.tags.filter((tag) => typeof tag === 'string') : [],
      subtasks: Array.isArray(t.subtasks) ? t.subtasks.map((s) => ({
        id: s?.id || uid('s'),
        title: String(s?.title || ''),
        done: Boolean(s?.done)
      })) : [],
      favorite: Boolean(t.favorite),
      recurrence: VALID_RECURRENCE.has(t.recurrence) ? t.recurrence : null,
      cancelReason: t.cancelReason || null
    }
  }).filter(Boolean) : currentState.tasks

  const projects = Array.isArray(d.projects) ? d.projects.map((p) => {
    if (!p || typeof p !== 'object') return null
    return {
      id: p.id || uid('p'),
      name: String(p.name || 'Sem nome').trim(),
      description: String(p.description || ''),
      color: typeof p.color === 'string' ? p.color : '#6366f1',
      due: p.due || null
    }
  }).filter(Boolean) : currentState.projects

  const categories = Array.isArray(d.categories) ? d.categories.map((c) => {
    if (!c || typeof c !== 'object') return null
    return {
      id: c.id || uid('c'),
      name: String(c.name || 'Sem nome').trim(),
      color: typeof c.color === 'string' ? c.color : '#94a3b8'
    }
  }).filter(Boolean) : currentState.categories

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
    ? d.notes
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
    appearance: d.appearance ? { ...currentState.appearance, ...d.appearance } : currentState.appearance,
    prefs: d.prefs ? { ...currentState.prefs, ...d.prefs } : currentState.prefs,
    notifPrefs: d.notifPrefs ? { ...currentState.notifPrefs, ...d.notifPrefs } : currentState.notifPrefs
  }
}

function reducer(state, action) {
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
      if (task.status === 'done' && newStatus !== 'done') {
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
      const next = { ...task, status: 'cancelled', ...(reason ? { cancelReason: reason } : {}) }
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
      const taskNotes = state.notes[action.taskId] || []
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
      const ids = action.taskIds
        ? new Set(Array.isArray(action.taskIds) ? action.taskIds : [action.taskIds])
        : action.taskId
          ? new Set([action.taskId])
          : null
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
        status: 'todo',
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
          [action.taskId]: [...(state.notes[action.taskId] || []), note]
        },
        activities: trimActivities([...acts, ...state.activities])
      }
    }
    case 'DELETE_NOTE': {
      const list = state.notes[action.taskId]
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
    case 'CLEAR_TRASH': {
      return { ...state, trash: [] }
    }
    case 'RESET': {
      return { ...initialState(), booted: true }
    }
    default:
      return state
  }
}

export { reducer }

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const prevDayRef = useRef(null)

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
    localStorage.setItem('taskflow-theme', state.theme)
  }, [state.theme])

  useEffect(() => {
    if (!state.booted) return
    const t = setTimeout(() => {
      try {
        const { _lastDuplicatedId, ...persisted } = state
        localStorage.setItem(PERSIST_KEY, JSON.stringify({ ...persisted, __v: PERSIST_VERSION }))
      } catch (e) {
        console.warn('[TaskFlow] Não foi possível salvar no localStorage:', e?.message || e)
        window.dispatchEvent(new CustomEvent('taskflow:storage-error', { detail: { error: e } }))
      }
    }, 400)
    return () => clearTimeout(t)
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore deve ser usado dentro de StoreProvider')
  return ctx
}

export function useMe() {
  const { state } = useStore()
  return state.me || { id: 'me', name: 'Você', bio: '' }
}

export function useTaskById(taskId) {
  const { state } = useStore()
  return useMemo(() => state.tasks.find((t) => t.id === taskId), [state.tasks, taskId])
}

export function useTaskNotes(taskId) {
  const { state } = useStore()
  return useMemo(() => state.notes[taskId] || [], [state.notes, taskId])
}
