import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer
} from 'react'
import { MOCK_STATE } from '../data/mock'
import { STATUS, PRIORITY, RECURRENCE, nextRecurrenceDate } from '../lib/constants'
import { formatDate } from '../lib/format'

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
 */
function spawnRecurrence(state, task) {
  if (!RECURRENCE[task.recurrence] || task.recurrence === 'none') return null
  const nextDue = nextRecurrenceDate(task.dueDate, task.recurrence)
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

function reducer(state, action) {
  switch (action.type) {
    case 'BOOT': {
      const now = Date.now()
      const day = 24 * 60 * 60 * 1000
      // Clean orphan reminders: remove reminders whose task no longer exists
      // or whose condition (overdue / upcoming) no longer applies
      const taskIds = new Set(state.tasks.map((t) => t.id))
      const reminders = state.reminders.filter((r) => {
        if (!r.taskId || !taskIds.has(r.taskId)) return false
        const task = state.tasks.find((t) => t.id === r.taskId)
        if (!task || task.status === 'done' || task.status === 'cancelled') return false
        if (!task.dueDate) return false
        const diff = new Date(task.dueDate).getTime() - now
        // Overdue reminders only make sense when actually overdue
        if (r.type === 'due' && r.title === 'Tarefa atrasada' && diff >= 0) return false
        // Upcoming reminders only make sense within the 3-day window
        if (r.type === 'due' && r.title === 'Vencimento próximo' && (diff > 3 * day || diff < 0)) return false
        return true
      })
      const has = (type, taskId) =>
        reminders.some((r) => r.type === type && r.taskId === taskId)
      state.tasks.forEach((t) => {
        if (!t.dueDate || t.status === 'done' || t.status === 'cancelled') return
        const diff = new Date(t.dueDate).getTime() - now
        if (diff < 0) {
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
        } else if (diff <= 3 * day && state.notifPrefs?.dueDates !== false) {
          if (!has('due', t.id)) {
            const days = Math.max(1, Math.ceil(diff / day))
            reminders.push(
              reminderEntry({
                type: 'due',
                title: 'Vencimento próximo',
                body: `"${t.title}" vence em ${days} dia(s).`,
                taskId: t.id
              })
            )
          }
        }
      })
      return { ...state, booted: true, reminders }
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
        dueDate: action.task.dueDate || null,
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
      const idx = state.tasks.findIndex((t) => t.id === action.taskId)
      if (idx === -1) return state
      const task = state.tasks[idx]
      const isDone = task.status === 'done'
      const tasks = state.tasks.slice()

      if (isDone) {
        // Reabrir
        tasks[idx] = { ...task, status: 'in_progress', progress: Math.min(task.progress, 99) }
        return {
          ...state,
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

      // Concluir
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
            text: `Próxima ocorrência de "${task.title}" criada${spawned.dueDate ? ` para ${formatDate(spawned.dueDate)}` : ''}`
          })
        )
      }
      return {
        ...state,
        tasks: spawned ? [spawned, ...tasks] : tasks,
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
          { task, notes: taskNotes }
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
        due: action.due ? new Date(action.due).toISOString() : null
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
      return {
        ...state,
        me: d.me || state.me,
        tasks: Array.isArray(d.tasks) ? d.tasks : state.tasks,
        projects: Array.isArray(d.projects) ? d.projects : state.projects,
        categories: Array.isArray(d.categories) ? d.categories : state.categories,
        notes: d.notes && typeof d.notes === 'object' ? d.notes : state.notes,
        activities: Array.isArray(d.activities) ? trimActivities(d.activities) : state.activities,
        trash: Array.isArray(d.trash) ? d.trash : state.trash,
        theme: d.theme || state.theme,
        appearance: d.appearance ? { ...state.appearance, ...d.appearance } : state.appearance,
        prefs: d.prefs ? { ...state.prefs, ...d.prefs } : state.prefs,
        notifPrefs: d.notifPrefs ? { ...state.notifPrefs, ...d.notifPrefs } : state.notifPrefs,
        reminders: Array.isArray(d.reminders) ? d.reminders : state.reminders
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

  useEffect(() => {
    const t = setTimeout(() => dispatch({ type: 'BOOT' }), 50)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark')
    localStorage.setItem('taskflow-theme', state.theme)
  }, [state.theme])

  useEffect(() => {
    if (!state.booted) return
    const t = setTimeout(() => {
      try {
        localStorage.setItem(PERSIST_KEY, JSON.stringify({ ...state, __v: PERSIST_VERSION }))
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
