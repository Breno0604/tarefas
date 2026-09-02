import { describe, it, expect, beforeEach } from 'vitest'
import { reducer, validateTaskPayload, initialState } from '../store/store'

/* ─── Helper: minimal personal state ─── */
const baseState = () => ({
  me: { id: 'me', name: 'Você', bio: 'Dev' },
  projects: [{ id: 'p1', name: 'Pessoal', color: '#6366f1' }],
  tasks: [
    { id: 't1', title: 'Task 1', description: 'Desc', status: 'todo', priority: 'high', projectId: 'p1', dueDate: '2026-09-01', createdAt: '2026-08-01', estimatedHours: 8, progress: 0, tags: ['bug'], subtasks: [], favorite: false, recurrence: null, cancelReason: null },
    { id: 't2', title: 'Task 2', description: '', status: 'in_progress', priority: 'medium', projectId: 'p1', dueDate: '2026-09-05', createdAt: '2026-08-02', estimatedHours: 4, progress: 80, tags: [], subtasks: [], favorite: true, recurrence: 'weekly', cancelReason: null }
  ],
  notes: { t1: [{ id: 'n1', text: 'Comment', createdAt: '2026-08-01' }] },
  activities: [],
  reminders: [],
  theme: 'light',
  booted: true,
  trash: [],
  prefs: { soundAlerts: false, compactMode: false },
  notifPrefs: { dueDates: true },
  appearance: { language: 'pt-BR', timezone: 'America/Sao_Paulo', firstDay: 'sunday' }
})

describe('persistence – task CRUD', () => {
  let state
  beforeEach(() => { state = baseState() })

  it('CREATE_TASK persists all fields including tags and subtasks', () => {
    const next = reducer(state, {
      type: 'CREATE_TASK',
      task: { title: 'Nova', tags: ['urgent'], subtasks: [{ title: 'Sub1' }, { title: 'Sub2' }], recurrence: 'daily' }
    })
    const created = next.tasks.find((t) => t.title === 'Nova')
    expect(created).toBeTruthy()
    expect(created.tags).toEqual(['urgent'])
    expect(created.subtasks).toHaveLength(2)
    expect(created.status).toBe('todo')
    expect(created.priority).toBe('medium')
    expect(created.favorite).toBe(false)
    expect(created.recurrence).toBe('daily')
  })

  it('UPDATE_TASK persists status change', () => {
    const next = reducer(state, { type: 'UPDATE_TASK', taskId: 't1', patch: { status: 'done' } })
    expect(next.tasks.find((t) => t.id === 't1').status).toBe('done')
  })

  it('UPDATE_TASK persists priority change', () => {
    const next = reducer(state, { type: 'UPDATE_TASK', taskId: 't1', patch: { priority: 'urgent' } })
    expect(next.tasks.find((t) => t.id === 't1').priority).toBe('urgent')
  })

  it('UPDATE_TASK persists recurrence change', () => {
    const next = reducer(state, { type: 'UPDATE_TASK', taskId: 't1', patch: { recurrence: 'monthly' } })
    expect(next.tasks.find((t) => t.id === 't1').recurrence).toBe('monthly')
  })

  it('UPDATE_TASK persists dueDate change', () => {
    const next = reducer(state, { type: 'UPDATE_TASK', taskId: 't1', patch: { dueDate: '2026-12-25' } })
    expect(next.tasks.find((t) => t.id === 't1').dueDate).toBe('2026-12-25')
  })

  it('UPDATE_TASK persists tags', () => {
    const next = reducer(state, { type: 'UPDATE_TASK', taskId: 't1', patch: { tags: ['feat', 'ui'] } })
    expect(next.tasks.find((t) => t.id === 't1').tags).toEqual(['feat', 'ui'])
  })

  it('UPDATE_TASK persists description', () => {
    const next = reducer(state, { type: 'UPDATE_TASK', taskId: 't1', patch: { description: 'Nova desc' } })
    expect(next.tasks.find((t) => t.id === 't1').description).toBe('Nova desc')
  })

  it('DELETE_TASK moves to trash with all data', () => {
    const next = reducer(state, { type: 'DELETE_TASK', taskId: 't1' })
    expect(next.tasks.find((t) => t.id === 't1')).toBeUndefined()
    expect(next.trash.length).toBe(1)
    expect(next.trash[0].task.id).toBe('t1')
    expect(next.trash[0].task.title).toBe('Task 1')
    expect(next.trash[0].task.tags).toEqual(['bug'])
  })

  it('RESTORE_TASK recovers all fields from trash', () => {
    let next = reducer(state, { type: 'DELETE_TASK', taskId: 't1' })
    next = reducer(next, { type: 'RESTORE_TASK', taskId: 't1' })
    const restored = next.tasks.find((t) => t.id === 't1')
    expect(restored).toBeTruthy()
    expect(restored.title).toBe('Task 1')
    expect(restored.status).toBe('todo')
    expect(restored.priority).toBe('high')
    expect(restored.tags).toEqual(['bug'])
  })

  it('DUPLICATE_TASK persists copy with all fields reset', () => {
    const next = reducer(state, { type: 'DUPLICATE_TASK', taskId: 't1' })
    const copy = next.tasks.find((t) => t.title.includes('cópia'))
    expect(copy).toBeTruthy()
    expect(copy.status).toBe('todo')
    expect(copy.progress).toBe(0)
    expect(copy.projectId).toBe('p1')
    expect(copy.favorite).toBe(false)
  })

  it('TOGGLE_FAVORITE persists favorite state', () => {
    const next = reducer(state, { type: 'TOGGLE_FAVORITE', taskId: 't1' })
    expect(next.tasks.find((t) => t.id === 't1').favorite).toBe(true)
    const next2 = reducer(next, { type: 'TOGGLE_FAVORITE', taskId: 't1' })
    expect(next2.tasks.find((t) => t.id === 't1').favorite).toBe(false)
  })

  it('TOGGLE_SUBTASK persists done state and recalculates progress', () => {
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

describe('persistence – notes & activities', () => {
  let state
  beforeEach(() => { state = baseState() })

  it('ADD_NOTE persists note with text and timestamp', () => {
    const next = reducer(state, { type: 'ADD_NOTE', taskId: 't1', text: 'Great!' })
    expect(next.notes.t1.length).toBe(2)
    expect(next.notes.t1[1].text).toBe('Great!')
    expect(next.notes.t1[1].createdAt).toBeTruthy()
  })

  it('CREATE_TASK generates activity entry', () => {
    const next = reducer(state, { type: 'CREATE_TASK', task: { title: 'X' } })
    expect(next.activities.some((a) => a.type === 'create' && a.text.includes('X'))).toBe(true)
  })

  it('activities have no actor (first person)', () => {
    const next = reducer(state, { type: 'UPDATE_TASK', taskId: 't1', patch: { status: 'in_progress' } })
    const act = next.activities.find((a) => a.type === 'status')
    expect(act.text.startsWith('Você')).toBe(true)
    expect(act.actorId).toBeUndefined()
  })

  it('DELETE_TASK removes notes when task is deleted', () => {
    expect(state.notes.t1).toHaveLength(1)
    const next = reducer(state, { type: 'DELETE_TASK', taskId: 't1' })
    expect(next.notes.t1).toBeUndefined()
  })
})

describe('persistence – projects', () => {
  let state
  beforeEach(() => { state = baseState() })

  it('CREATE_PROJECT persists all fields without members', () => {
    const next = reducer(state, { type: 'CREATE_PROJECT', name: 'Beta', color: '#0ea5e9', due: '2026-10-01' })
    const p = next.projects.find((pr) => pr.name === 'Beta')
    expect(p).toBeTruthy()
    expect(p.color).toBe('#0ea5e9')
    expect(p.due).toBeTruthy()
    expect(p.members).toBeUndefined()
  })
})

describe('persistence – reminders', () => {
  let state
  beforeEach(() => {
    state = baseState()
    state.reminders = [
      { id: 'r1', type: 'due', title: 'Test', body: 'Body', taskId: 't1', read: false, createdAt: '2026-08-01' },
      { id: 'r2', type: 'due', title: 'Test2', body: 'Body2', taskId: 't2', read: false, createdAt: '2026-08-02' }
    ]
  })

  it('MARK_REMINDER_READ persists read status', () => {
    const next = reducer(state, { type: 'MARK_REMINDER_READ', id: 'r1' })
    expect(next.reminders.find((r) => r.id === 'r1').read).toBe(true)
    expect(next.reminders.find((r) => r.id === 'r2').read).toBe(false)
  })

  it('MARK_ALL_REMINDERS_READ persists all as read', () => {
    const next = reducer(state, { type: 'MARK_ALL_REMINDERS_READ' })
    expect(next.reminders.every((r) => r.read)).toBe(true)
  })

  it('CLEAR_REMINDERS empties list', () => {
    const next = reducer(state, { type: 'CLEAR_REMINDERS' })
    expect(next.reminders.length).toBe(0)
  })
})

describe('persistence – prefs, notifPrefs, appearance', () => {
  let state
  beforeEach(() => { state = baseState() })

  it('UPDATE_PREFS persists preference changes', () => {
    const next = reducer(state, { type: 'UPDATE_PREFS', prefs: { soundAlerts: true, compactMode: true } })
    expect(next.prefs.soundAlerts).toBe(true)
    expect(next.prefs.compactMode).toBe(true)
  })

  it('UPDATE_NOTIF_PREFS persists reminder preference changes', () => {
    const next = reducer(state, { type: 'UPDATE_NOTIF_PREFS', notifPrefs: { dueDates: false } })
    expect(next.notifPrefs.dueDates).toBe(false)
  })

  it('UPDATE_APPEARANCE persists appearance changes', () => {
    const next = reducer(state, { type: 'UPDATE_APPEARANCE', appearance: { firstDay: 'monday', language: 'en-US' } })
    expect(next.appearance.firstDay).toBe('monday')
    expect(next.appearance.language).toBe('en-US')
    expect(next.appearance.timezone).toBe('America/Sao_Paulo') // unchanged
  })

  it('UPDATE_ME persists profile fields', () => {
    const next = reducer(state, { type: 'UPDATE_ME', patch: { name: 'Novo nome', bio: 'Nova bio' } })
    expect(next.me.name).toBe('Novo nome')
    expect(next.me.bio).toBe('Nova bio')
  })
})

describe('persistence – undo/restore cycle', () => {
  let state
  beforeEach(() => { state = baseState() })

  it('delete → restore preserves all task fields and notes', () => {
    let next = reducer(state, { type: 'DELETE_TASK', taskId: 't1' })
    expect(next.tasks.length).toBe(1)
    expect(next.trash.length).toBe(1)

    next = reducer(next, { type: 'RESTORE_TASK', taskId: 't1' })
    expect(next.tasks.length).toBe(2)
    expect(next.trash.length).toBe(0)

    const restored = next.tasks.find((t) => t.id === 't1')
    expect(restored.title).toBe('Task 1')
    expect(restored.description).toBe('Desc')
    expect(restored.status).toBe('todo')
    expect(restored.priority).toBe('high')
    expect(restored.projectId).toBe('p1')
    expect(restored.projectId).toBe('p1')
    expect(restored.dueDate).toBe('2026-09-01')
    expect(restored.estimatedHours).toBe(8)
    expect(restored.tags).toEqual(['bug'])
    expect(next.notes.t1).toHaveLength(1)
    expect(next.notes.t1[0].text).toBe('Comment')
  })

  it('complete recurring → new occurrence carries task data forward', () => {
    state.tasks[0].recurrence = 'monthly'
    const next = reducer(state, { type: 'TOGGLE_TASK_DONE', taskId: 't1' })
    const spawned = next.tasks.find((t) => t.title === 'Task 1' && t.id !== 't1')
    expect(spawned.recurrence).toBe('monthly')
    expect(spawned.tags).toEqual(['bug'])
    expect(spawned.estimatedHours).toBe(8)
  })
})

describe('persistence – cross-field integrity', () => {
  let state
  beforeEach(() => { state = baseState() })

  it('CANCEL_TASK persists optional cancelReason only when given', () => {
    const next = reducer(state, { type: 'CANCEL_TASK', taskId: 't1', reason: 'Out of scope' })
    const task = next.tasks.find((t) => t.id === 't1')
    expect(task.status).toBe('cancelled')
    expect(task.cancelReason).toBe('Out of scope')
  })

  it('CANCEL_TASK without reason leaves cancelReason empty', () => {
    const next = reducer(state, { type: 'CANCEL_TASK', taskId: 't1', reason: null })
    expect(next.tasks.find((t) => t.id === 't1').cancelReason).toBeFalsy()
  })

  it('theme persists across state', () => {
    const next = reducer(state, { type: 'SET_THEME', theme: 'dark' })
    expect(next.theme).toBe('dark')
  })

  it('validateTaskPayload still guards writes', () => {
    expect(validateTaskPayload({ title: '' }).length).toBeGreaterThan(0)
    const blocked = reducer(state, { type: 'CREATE_TASK', task: { title: '' } })
    expect(blocked.tasks.length).toBe(state.tasks.length)
  })
})

describe('persistence – import cycle (simulating JSON import)', () => {
  let state
  beforeEach(() => { state = baseState() })

  it('IMPORT_DATA replaces state preserving ids, notes and references', () => {
    const imported = {
      me: { id: 'me', name: 'Importado', bio: 'Bio' },
      projects: [{ id: 'px', name: 'Proj X', color: '#0ea5e9', due: null }],
      tasks: [
        {
          id: 'tx',
          title: 'Tarefa importada',
          description: 'd',
          status: 'in_progress',
          priority: 'high',
          projectId: 'px',
          dueDate: '2026-09-01T12:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          estimatedHours: 5,
          progress: 40,
          tags: ['x'],
          subtasks: [],
          favorite: true,
          recurrence: null,
          cancelReason: null
        }
      ],
      notes: { tx: [{ id: 'n1', text: 'nota', createdAt: '2026-01-01' }] },
      activities: [{ id: 'a1', type: 'create', taskId: 'tx', text: 'x', createdAt: '2026-01-01' }],
      reminders: [],
      trash: [],
      theme: 'dark',
      prefs: { soundAlerts: true, compactMode: false },
      notifPrefs: { dueDates: false },
      appearance: { firstDay: 'monday' }
    }
    const next = reducer(state, { type: 'IMPORT_DATA', data: imported })
    expect(next.tasks).toHaveLength(1)
    expect(next.tasks[0].id).toBe('tx')
    expect(next.tasks[0].projectId).toBe('px')
    expect(next.tasks[0].progress).toBe(40)
    expect(next.projects[0].id).toBe('px')
    expect(next.notes.tx).toHaveLength(1)
    expect(next.activities).toHaveLength(1)
    expect(next.theme).toBe('dark')
    expect(next.prefs.soundAlerts).toBe(true)
    expect(next.appearance.firstDay).toBe('monday')
  })

  it('IMPORT_DATA keeps current values for missing optional fields', () => {
    const imported = { me: { id: 'me', name: 'X' }, tasks: [], projects: [] }
    const next = reducer(state, { type: 'IMPORT_DATA', data: imported })
    expect(next.theme).toBe('light')
    expect(next.notes).toEqual(state.notes)
  })

  it('RESET then CREATE_TASK replicates imported data', () => {
    // Simulate what the import function does
    let next = reducer(state, { type: 'RESET' })
    expect(next.tasks.length).toBeGreaterThan(0) // mock data restored

    // Now import custom tasks
    const importTasks = [
      { title: 'Imported Task 1', status: 'todo', priority: 'high' },
      { title: 'Imported Task 2', status: 'in_progress', priority: 'medium' }
    ]
    importTasks.forEach((t) => {
      next = reducer(next, { type: 'CREATE_TASK', task: t })
    })
    // Should have mock tasks + imported tasks
    expect(next.tasks.length).toBeGreaterThan(2)
    expect(next.tasks.some((t) => t.title === 'Imported Task 1')).toBe(true)
    expect(next.tasks.some((t) => t.title === 'Imported Task 2')).toBe(true)
  })

  it('import preserves projects', () => {
    let next = reducer(state, { type: 'RESET' })
    next = reducer(next, { type: 'CREATE_PROJECT', name: 'Projeto Importado', color: '#ef4444' })
    expect(next.projects.some((p) => p.name === 'Projeto Importado')).toBe(true)
  })

  it('imported data persists through theme change', () => {
    let next = reducer(state, { type: 'RESET' })
    next = reducer(next, { type: 'CREATE_TASK', task: { title: 'Persist Test' } })
    next = reducer(next, { type: 'SET_THEME', theme: 'dark' })
    expect(next.theme).toBe('dark')
    expect(next.tasks.some((t) => t.title === 'Persist Test')).toBe(true)
  })
})
