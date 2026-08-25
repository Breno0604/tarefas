import { describe, it, expect, beforeEach } from 'vitest'
import { reducer, validateTaskPayload } from '../store/store'

/* ─── Helper: minimal personal state ─── */
const baseState = () => ({
  me: { id: 'me', name: 'Você', bio: '' },
  projects: [{ id: 'p1', name: 'Pessoal', color: '#6366f1' }],
  categories: [{ id: 'c1', name: 'Casa', color: '#6366f1' }],
  tasks: [
    { id: 't1', title: 'Task 1', description: '', status: 'todo', priority: 'high', projectId: 'p1', categoryId: 'c1', dueDate: '2026-09-01', createdAt: '2026-08-01', estimatedHours: 8, progress: 0, tags: [], subtasks: [], favorite: false, recurrence: null, cancelReason: null },
    { id: 't2', title: 'Task 2', description: '', status: 'in_progress', priority: 'medium', projectId: 'p1', categoryId: 'c1', dueDate: '2026-09-05', createdAt: '2026-08-02', estimatedHours: 4, progress: 80, tags: [], subtasks: [], favorite: true, recurrence: null, cancelReason: null }
  ],
  notes: { t1: [{ id: 'n1', text: 'Old note', createdAt: '2026-08-01' }] },
  activities: [],
  reminders: [],
  theme: 'light',
  booted: true,
  trash: []
})

describe('reducer', () => {
  let state

  beforeEach(() => {
    state = baseState()
  })

  /* ─── Theme ─── */
  describe('SET_THEME', () => {
    it('toggles theme', () => {
      const next = reducer(state, { type: 'SET_THEME', theme: 'dark' })
      expect(next.theme).toBe('dark')
    })
  })

  /* ─── Task CRUD ─── */
  describe('CREATE_TASK', () => {
    it('creates a new task with defaults', () => {
      const next = reducer(state, { type: 'CREATE_TASK', task: { title: 'Nova tarefa' } })
      expect(next.tasks.length).toBe(3)
      expect(next.tasks[0].title).toBe('Nova tarefa')
      expect(next.tasks[0].status).toBe('todo')
      expect(next.tasks[0].priority).toBe('medium')
      expect(next.tasks[0].recurrence).toBeNull()
    })

    it('creates activity entry in first person', () => {
      const next = reducer(state, { type: 'CREATE_TASK', task: { title: 'Nova tarefa' } })
      expect(next.activities.length).toBe(1)
      expect(next.activities[0].type).toBe('create')
      expect(next.activities[0].text).toContain('Você criou')
      expect(next.activities[0].actorId).toBeUndefined()
    })

    it('rejects invalid payload', () => {
      const next = reducer(state, { type: 'CREATE_TASK', task: { title: '' } })
      expect(next.tasks.length).toBe(2)
    })

    it('persists recurrence when provided', () => {
      const next = reducer(state, { type: 'CREATE_TASK', task: { title: 'X', recurrence: 'weekly' } })
      expect(next.tasks[0].recurrence).toBe('weekly')
    })
  })

  describe('UPDATE_TASK', () => {
    it('updates a task', () => {
      const next = reducer(state, { type: 'UPDATE_TASK', taskId: 't1', patch: { status: 'in_progress' } })
      expect(next.tasks.find((t) => t.id === 't1').status).toBe('in_progress')
    })

    it('creates activity for status change', () => {
      const next = reducer(state, { type: 'UPDATE_TASK', taskId: 't1', patch: { status: 'in_progress' } })
      expect(next.activities.some((a) => a.type === 'status')).toBe(true)
    })

    it('creates activity for priority change', () => {
      const next = reducer(state, { type: 'UPDATE_TASK', taskId: 't1', patch: { priority: 'urgent' } })
      expect(next.activities.some((a) => a.type === 'priority')).toBe(true)
    })

    it('blocks if task not found', () => {
      const next = reducer(state, { type: 'UPDATE_TASK', taskId: 'nonexistent', patch: { status: 'done' } })
      expect(next.tasks.length).toBe(2)
    })

    it('rejects invalid payload', () => {
      const next = reducer(state, { type: 'UPDATE_TASK', taskId: 't1', patch: { title: '' } })
      expect(next.tasks[0].title).toBe('Task 1')
      expect(next.activities.length).toBe(0)
    })
  })

  describe('TOGGLE_TASK_DONE', () => {
    it('completes an open task with full progress', () => {
      const next = reducer(state, { type: 'TOGGLE_TASK_DONE', taskId: 't1' })
      const task = next.tasks.find((t) => t.id === 't1')
      expect(task.status).toBe('done')
      expect(task.progress).toBe(100)
    })

    it('reopens a done task as in_progress', () => {
      state.tasks[0].status = 'done'
      state.tasks[0].progress = 100
      const next = reducer(state, { type: 'TOGGLE_TASK_DONE', taskId: 't1' })
      const task = next.tasks.find((t) => t.id === 't1')
      expect(task.status).toBe('in_progress')
      expect(task.progress).toBe(99)
    })

    it('spawns next occurrence for recurring task', () => {
      state.tasks[0].recurrence = 'weekly'
      state.tasks[0].subtasks = [
        { id: 's1', title: 'A', done: true },
        { id: 's2', title: 'B', done: true }
      ]
      const next = reducer(state, { type: 'TOGGLE_TASK_DONE', taskId: 't1' })
      // original completed
      expect(next.tasks.find((t) => t.id === 't1').status).toBe('done')
      // spawned copy exists
      const spawned = next.tasks.find((t) => t.id !== 't1' && t.title === 'Task 1')
      expect(spawned).toBeTruthy()
      expect(spawned.status).toBe('todo')
      expect(spawned.recurrence).toBe('weekly')
      expect(spawned.progress).toBe(0)
      expect(spawned.subtasks.every((s) => !s.done)).toBe(true)
      // due date advanced by 7 days
      expect(new Date(spawned.dueDate).getTime()).toBe(new Date('2026-09-08').getTime())
    })

    it('does not spawn for non-recurring task', () => {
      const next = reducer(state, { type: 'TOGGLE_TASK_DONE', taskId: 't1' })
      expect(next.tasks.length).toBe(2)
    })

    it('ignores unknown task', () => {
      const next = reducer(state, { type: 'TOGGLE_TASK_DONE', taskId: 'nope' })
      expect(next).toBe(state)
    })
  })

  describe('CANCEL_TASK', () => {
    it('cancels a task with reason', () => {
      const next = reducer(state, { type: 'CANCEL_TASK', taskId: 't1', reason: 'No longer needed' })
      const task = next.tasks.find((t) => t.id === 't1')
      expect(task.status).toBe('cancelled')
      expect(task.cancelReason).toBe('No longer needed')
    })

    it('cancels without reason (optional)', () => {
      const next = reducer(state, { type: 'CANCEL_TASK', taskId: 't1', reason: null })
      const task = next.tasks.find((t) => t.id === 't1')
      expect(task.status).toBe('cancelled')
      expect(task.cancelReason).toBeFalsy()
    })

    it('blocks cancel on done task', () => {
      state.tasks[0].status = 'done'
      const next = reducer(state, { type: 'CANCEL_TASK', taskId: 't1', reason: 'X' })
      expect(next.tasks.find((t) => t.id === 't1').status).toBe('done')
    })

    it('blocks double-cancel', () => {
      state.tasks[0].status = 'cancelled'
      const next = reducer(state, { type: 'CANCEL_TASK', taskId: 't1', reason: 'X' })
      expect(next).toBe(state)
    })
  })

  describe('DELETE_TASK / RESTORE_TASK', () => {
    it('deletes a task and moves to trash with its notes', () => {
      const next = reducer(state, { type: 'DELETE_TASK', taskId: 't1' })
      expect(next.tasks.length).toBe(1)
      expect(next.trash.length).toBe(1)
      expect(next.trash[0].task.id).toBe('t1')
      expect(next.trash[0].notes).toHaveLength(1)
      expect(next.notes.t1).toBeUndefined()
    })

    it('creates delete activity', () => {
      const next = reducer(state, { type: 'DELETE_TASK', taskId: 't1' })
      expect(next.activities.some((a) => a.type === 'delete')).toBe(true)
    })

    it('restores a task from trash with its notes', () => {
      let next = reducer(state, { type: 'DELETE_TASK', taskId: 't1' })
      next = reducer(next, { type: 'RESTORE_TASK', taskId: 't1' })
      expect(next.tasks.length).toBe(2)
      expect(next.trash.length).toBe(0)
      expect(next.notes.t1).toHaveLength(1)
    })
  })

  /* ─── Favorites ─── */
  describe('TOGGLE_FAVORITE', () => {
    it('toggles favorite on a task', () => {
      const next = reducer(state, { type: 'TOGGLE_FAVORITE', taskId: 't1' })
      expect(next.tasks.find((t) => t.id === 't1').favorite).toBe(true)
      const next2 = reducer(next, { type: 'TOGGLE_FAVORITE', taskId: 't1' })
      expect(next2.tasks.find((t) => t.id === 't1').favorite).toBe(false)
    })
  })

  /* ─── Duplicate ─── */
  describe('DUPLICATE_TASK', () => {
    it('duplicates a task with (cópia) suffix, reset status', () => {
      const next = reducer(state, { type: 'DUPLICATE_TASK', taskId: 't1' })
      expect(next.tasks.length).toBe(3)
      expect(next.tasks[0].title).toBe('Task 1 (cópia)')
      expect(next.tasks[0].status).toBe('todo')
      expect(next.tasks[0].progress).toBe(0)
    })
  })

  /* ─── Subtasks ─── */
  describe('TOGGLE_SUBTASK', () => {
    it('toggles a subtask and updates progress', () => {
      state.tasks[0].subtasks = [
        { id: 's1', title: 'A', done: false },
        { id: 's2', title: 'B', done: false }
      ]
      const next = reducer(state, { type: 'TOGGLE_SUBTASK', taskId: 't1', subtaskId: 's1' })
      const task = next.tasks.find((t) => t.id === 't1')
      expect(task.subtasks[0].done).toBe(true)
      expect(task.progress).toBe(50)
    })
  })

  /* ─── Notes ─── */
  describe('ADD_NOTE', () => {
    it('adds a note with timestamp and activity', () => {
      const next = reducer(state, { type: 'ADD_NOTE', taskId: 't1', text: 'Progresso hoje' })
      expect(next.notes.t1.length).toBe(2)
      expect(next.notes.t1[1].text).toBe('Progresso hoje')
      expect(next.notes.t1[1].createdAt).toBeTruthy()
      expect(next.activities.some((a) => a.type === 'note')).toBe(true)
    })

    it('rejects empty note', () => {
      const next = reducer(state, { type: 'ADD_NOTE', taskId: 't1', text: '   ' })
      expect(next).toBe(state)
    })

    it('rejects note on nonexistent task', () => {
      const next = reducer(state, { type: 'ADD_NOTE', taskId: 'nope', text: 'x' })
      expect(next).toBe(state)
    })
  })

  describe('DELETE_NOTE', () => {
    it('removes a specific note', () => {
      const next = reducer(state, { type: 'DELETE_NOTE', taskId: 't1', noteId: 'n1' })
      expect(next.notes.t1).toHaveLength(0)
    })

    it('ignores unknown note', () => {
      const next = reducer(state, { type: 'DELETE_NOTE', taskId: 't1', noteId: 'nope' })
      expect(next.notes.t1).toHaveLength(1)
    })
  })

  /* ─── Reminders ─── */
  describe('reminders', () => {
    it('MARK_REMINDER_READ marks one reminder read', () => {
      state.reminders = [
        { id: 'r1', type: 'due', title: 'T', body: 'B', taskId: 't1', read: false },
        { id: 'r2', type: 'due', title: 'T2', body: 'B2', taskId: 't2', read: false }
      ]
      const next = reducer(state, { type: 'MARK_REMINDER_READ', id: 'r1' })
      expect(next.reminders.find((r) => r.id === 'r1').read).toBe(true)
      expect(next.reminders.find((r) => r.id === 'r2').read).toBe(false)
    })

    it('MARK_ALL_REMINDERS_READ marks everything read', () => {
      state.reminders = [
        { id: 'r1', read: false },
        { id: 'r2', read: false }
      ]
      const next = reducer(state, { type: 'MARK_ALL_REMINDERS_READ' })
      expect(next.reminders.every((r) => r.read)).toBe(true)
    })

    it('CLEAR_REMINDERS empties the list', () => {
      state.reminders = [{ id: 'r1' }]
      const next = reducer(state, { type: 'CLEAR_REMINDERS' })
      expect(next.reminders.length).toBe(0)
    })
  })

  /* ─── BOOT generates overdue/upcoming reminders ─── */
  describe('BOOT', () => {
    it('generates reminder for overdue open task', () => {
      state.tasks = [
        { ...state.tasks[0], dueDate: new Date(Date.now() - 86400000).toISOString(), status: 'todo', recurrence: null }
      ]
      state.booted = false
      const next = reducer(state, { type: 'BOOT' })
      expect(next.booted).toBe(true)
      expect(next.reminders.some((r) => r.type === 'due' && r.title === 'Tarefa atrasada')).toBe(true)
    })

    it('does not remind for done tasks', () => {
      state.tasks = [
        { ...state.tasks[0], dueDate: new Date(Date.now() - 86400000).toISOString(), status: 'done' }
      ]
      state.booted = false
      const next = reducer(state, { type: 'BOOT' })
      expect(next.reminders.length).toBe(0)
    })

    it('deduplicates reminders per task', () => {
      const due = new Date(Date.now() - 86400000).toISOString()
      state.tasks = [
        { ...state.tasks[0], dueDate: due, status: 'todo' }
      ]
      state.reminders = [
        { id: 'r1', type: 'due', title: 'Tarefa atrasada', body: 'x', taskId: 't1', read: true }
      ]
      state.booted = false
      const next = reducer(state, { type: 'BOOT' })
      expect(next.reminders.filter((r) => r.taskId === 't1').length).toBe(1)
    })
  })

  /* ─── Me ─── */
  describe('UPDATE_ME', () => {
    it('updates name and bio', () => {
      const next = reducer(state, { type: 'UPDATE_ME', patch: { name: 'Breno', bio: 'Dev' } })
      expect(next.me.name).toBe('Breno')
      expect(next.me.bio).toBe('Dev')
    })
  })

  /* ─── Projects / Categories ─── */
  describe('CREATE_PROJECT', () => {
    it('creates a project without members', () => {
      const next = reducer(state, { type: 'CREATE_PROJECT', name: 'Beta', color: '#0ea5e9' })
      expect(next.projects.length).toBe(2)
      expect(next.projects[1].name).toBe('Beta')
      expect(next.projects[1].members).toBeUndefined()
      expect(next.activities.some((a) => a.text.includes('Beta'))).toBe(true)
    })
  })

  describe('CREATE_CATEGORY', () => {
    it('creates a category', () => {
      const next = reducer(state, { type: 'CREATE_CATEGORY', name: 'Bug', color: '#ef4444' })
      expect(next.categories.length).toBe(2)
      expect(next.categories[1].name).toBe('Bug')
    })
  })

  /* ─── Prefs / appearance ─── */
  describe('prefs and appearance', () => {
    it('UPDATE_PREFS merges preferences', () => {
      state.prefs = { soundAlerts: false, compactMode: false }
      const next = reducer(state, { type: 'UPDATE_PREFS', prefs: { compactMode: true } })
      expect(next.prefs.compactMode).toBe(true)
      expect(next.prefs.soundAlerts).toBe(false)
    })

    it('UPDATE_NOTIF_PREFS merges reminder prefs', () => {
      state.notifPrefs = { dueDates: true }
      const next = reducer(state, { type: 'UPDATE_NOTIF_PREFS', notifPrefs: { dueDates: false } })
      expect(next.notifPrefs.dueDates).toBe(false)
    })

    it('UPDATE_APPEARANCE merges appearance', () => {
      state.appearance = { language: 'pt-BR', timezone: 'America/Sao_Paulo', firstDay: 'sunday' }
      const next = reducer(state, { type: 'UPDATE_APPEARANCE', appearance: { firstDay: 'monday' } })
      expect(next.appearance.firstDay).toBe('monday')
      expect(next.appearance.language).toBe('pt-BR')
    })
  })

  /* ─── Reset ─── */
  describe('RESET', () => {
    it('resets to initial state with data restored', () => {
      state.tasks = []
      state.theme = 'dark'
      const next = reducer(state, { type: 'RESET' })
      expect(next.tasks.length).toBeGreaterThan(0)
      expect(next.booted).toBe(true)
    })
  })

  /* ─── Default ─── */
  describe('unknown action', () => {
    it('returns state unchanged', () => {
      const next = reducer(state, { type: 'UNKNOWN_ACTION' })
      expect(next).toBe(state)
    })
  })

  /* ─── validateTaskPayload ─── */
  describe('validateTaskPayload', () => {
    it('returns empty array for valid task', () => {
      expect(validateTaskPayload({ title: 'Test' })).toEqual([])
    })

    it('returns error for empty title', () => {
      const errors = validateTaskPayload({ title: '' })
      expect(errors.length).toBe(1)
      expect(errors[0]).toMatch(/título/i)
    })

    it('returns error for whitespace-only title', () => {
      expect(validateTaskPayload({ title: '   ' }).length).toBe(1)
    })

    it('returns error for negative estimatedHours', () => {
      const errors = validateTaskPayload({ title: 'Ok', estimatedHours: -5 })
      expect(errors.length).toBe(1)
      expect(errors[0]).toMatch(/horas/i)
    })

    it('returns error for invalid dueDate', () => {
      const errors = validateTaskPayload({ title: 'Ok', dueDate: 'not-a-date' })
      expect(errors.length).toBe(1)
      expect(errors[0]).toMatch(/data/i)
    })

    it('returns multiple errors for multiple invalid fields', () => {
      expect(validateTaskPayload({ title: '', estimatedHours: -1, dueDate: 'bad' }).length).toBe(3)
    })

    it('returns error for null/undefined payload', () => {
      expect(validateTaskPayload(null).length).toBeGreaterThan(0)
      expect(validateTaskPayload(undefined).length).toBeGreaterThan(0)
    })

    it('ignores fields not in the payload', () => {
      expect(validateTaskPayload({})).toEqual([])
    })
  })
})
