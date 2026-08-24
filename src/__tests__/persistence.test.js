import { describe, it, expect, beforeEach } from 'vitest'
import { reducer, validateTaskPayload } from '../store/store'

/* ─── Helper: minimal state with all permissions ─── */
const adminState = () => ({
  users: [
    { id: 'u1', name: 'Ana', role: 'Gerente', email: 'a@b.com', color: '#6366f1', online: true, active: true, profileIds: ['pr1'], bio: 'Gestora de projetos' },
    { id: 'u2', name: 'Bruno', role: 'Dev', email: 'b@b.com', color: '#0ea5e9', online: true, active: true, profileIds: ['pr2'] }
  ],
  profiles: [
    { id: 'pr1', name: 'Admin', level: 'admin', permissions: ['view_tasks', 'create_tasks', 'edit_tasks', 'delete_tasks', 'assign_tasks', 'manage_projects', 'manage_team', 'manage_profiles', 'view_settings'], createdBy: 'u1', color: '#f43f5e', createdAt: '2026-01-01' },
    { id: 'pr2', name: 'Member', level: 'member', permissions: ['view_tasks', 'create_tasks', 'edit_tasks'], createdBy: 'u1', color: '#6366f1', createdAt: '2026-01-01' }
  ],
  projects: [{ id: 'p1', name: 'Alpha', color: '#6366f1', members: ['u1', 'u2'] }],
  categories: [{ id: 'c1', name: 'Dev', color: '#6366f1' }],
  tasks: [
    { id: 't1', title: 'Task 1', description: 'Desc', status: 'todo', priority: 'high', assigneeId: 'u2', projectId: 'p1', categoryId: 'c1', dueDate: '2026-09-01', createdAt: '2026-08-01', estimatedHours: 8, progress: 0, tags: ['bug'], subtasks: [], favorite: false },
    { id: 't2', title: 'Task 2', description: '', status: 'review', priority: 'medium', assigneeId: 'u2', projectId: 'p1', categoryId: 'c1', dueDate: '2026-09-05', createdAt: '2026-08-02', estimatedHours: 4, progress: 80, tags: [], subtasks: [], favorite: true }
  ],
  comments: { t1: [{ id: 'cm1', userId: 'u2', text: 'Comment', createdAt: '2026-08-01' }] },
  activities: [],
  notifications: [],
  currentUserId: 'u1',
  currentProfileId: 'pr1',
  theme: 'light',
  booted: true,
  trash: [],
  prefs: { emailWeekly: true, emailMentions: true, soundAlerts: false, compactMode: false, autoAssign: true },
  notifPrefs: { assignments: true, mentions: true, dueDates: true, statusChanges: true, comments: true, digests: false },
  appearance: { language: 'pt-BR', timezone: 'America/Sao_Paulo', firstDay: 'sunday' }
})

describe('persistence – task CRUD', () => {
  let state
  beforeEach(() => { state = adminState() })

  it('CREATE_TASK persists all fields including tags and subtasks', () => {
    const next = reducer(state, {
      type: 'CREATE_TASK',
      task: { title: 'Nova', tags: ['urgent'], subtasks: [{ title: 'Sub1' }, { title: 'Sub2' }] },
      actorId: 'u1'
    })
    const created = next.tasks.find((t) => t.title === 'Nova')
    expect(created).toBeTruthy()
    expect(created.tags).toEqual(['urgent'])
    expect(created.subtasks).toHaveLength(2)
    expect(created.status).toBe('todo')
    expect(created.priority).toBe('medium')
    expect(created.favorite).toBe(false)
  })

  it('UPDATE_TASK persists status change', () => {
    const next = reducer(state, { type: 'UPDATE_TASK', taskId: 't1', patch: { status: 'done' }, actorId: 'u1' })
    expect(next.tasks.find((t) => t.id === 't1').status).toBe('done')
  })

  it('UPDATE_TASK persists priority change', () => {
    const next = reducer(state, { type: 'UPDATE_TASK', taskId: 't1', patch: { priority: 'urgent' }, actorId: 'u1' })
    expect(next.tasks.find((t) => t.id === 't1').priority).toBe('urgent')
  })

  it('UPDATE_TASK persists assignee reassignment', () => {
    const next = reducer(state, { type: 'UPDATE_TASK', taskId: 't1', patch: { assigneeId: 'u1' }, actorId: 'u1' })
    expect(next.tasks.find((t) => t.id === 't1').assigneeId).toBe('u1')
  })

  it('UPDATE_TASK persists dueDate change', () => {
    const next = reducer(state, { type: 'UPDATE_TASK', taskId: 't1', patch: { dueDate: '2026-12-25' }, actorId: 'u1' })
    expect(next.tasks.find((t) => t.id === 't1').dueDate).toBe('2026-12-25')
  })

  it('UPDATE_TASK persists tags', () => {
    const next = reducer(state, { type: 'UPDATE_TASK', taskId: 't1', patch: { tags: ['feat', 'ui'] }, actorId: 'u1' })
    expect(next.tasks.find((t) => t.id === 't1').tags).toEqual(['feat', 'ui'])
  })

  it('UPDATE_TASK persists description', () => {
    const next = reducer(state, { type: 'UPDATE_TASK', taskId: 't1', patch: { description: 'Nova desc' }, actorId: 'u1' })
    expect(next.tasks.find((t) => t.id === 't1').description).toBe('Nova desc')
  })

  it('DELETE_TASK moves to trash with all data', () => {
    const next = reducer(state, { type: 'DELETE_TASK', taskId: 't1', actorId: 'u1' })
    expect(next.tasks.find((t) => t.id === 't1')).toBeUndefined()
    expect(next.trash.length).toBe(1)
    expect(next.trash[0].task.id).toBe('t1')
    expect(next.trash[0].task.title).toBe('Task 1')
    expect(next.trash[0].task.tags).toEqual(['bug'])
  })

  it('RESTORE_TASK recovers all fields from trash', () => {
    let next = reducer(state, { type: 'DELETE_TASK', taskId: 't1', actorId: 'u1' })
    next = reducer(next, { type: 'RESTORE_TASK', taskId: 't1', actorId: 'u1' })
    const restored = next.tasks.find((t) => t.id === 't1')
    expect(restored).toBeTruthy()
    expect(restored.title).toBe('Task 1')
    expect(restored.status).toBe('todo')
    expect(restored.priority).toBe('high')
    expect(restored.assigneeId).toBe('u2')
    expect(restored.tags).toEqual(['bug'])
  })

  it('DUPLICATE_TASK persists copy with all fields', () => {
    const next = reducer(state, { type: 'DUPLICATE_TASK', taskId: 't1', actorId: 'u1' })
    const copy = next.tasks.find((t) => t.title.includes('cópia'))
    expect(copy).toBeTruthy()
    expect(copy.status).toBe('todo')
    expect(copy.priority).toBe('high')
    expect(copy.projectId).toBe('p1')
    expect(copy.progress).toBe(0)
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

describe('persistence – comments & activities', () => {
  let state
  beforeEach(() => { state = adminState() })

  it('ADD_COMMENT persists comment with text and timestamp', () => {
    const next = reducer(state, { type: 'ADD_COMMENT', taskId: 't1', userId: 'u1', text: 'Great!' })
    expect(next.comments.t1.length).toBe(2)
    expect(next.comments.t1[1].text).toBe('Great!')
    expect(next.comments.t1[1].userId).toBe('u1')
    expect(next.comments.t1[1].createdAt).toBeTruthy()
  })

  it('CREATE_TASK generates activity entry', () => {
    const next = reducer(state, { type: 'CREATE_TASK', task: { title: 'X' }, actorId: 'u1' })
    expect(next.activities.some((a) => a.type === 'create' && a.text.includes('X'))).toBe(true)
  })

  it('UPDATE_TASK generates activity for status change', () => {
    const next = reducer(state, { type: 'UPDATE_TASK', taskId: 't1', patch: { status: 'in_progress' }, actorId: 'u1' })
    expect(next.activities.some((a) => a.type === 'status')).toBe(true)
  })

  it('DELETE_TASK generates activity entry', () => {
    const next = reducer(state, { type: 'DELETE_TASK', taskId: 't1', actorId: 'u1' })
    expect(next.activities.some((a) => a.type === 'delete')).toBe(true)
  })

  it('ADD_COMMENT removes comments when task is deleted', () => {
    expect(state.comments.t1).toHaveLength(1)
    const next = reducer(state, { type: 'DELETE_TASK', taskId: 't1', actorId: 'u1' })
    expect(next.comments.t1).toBeUndefined()
  })
})

describe('persistence – projects & categories', () => {
  let state
  beforeEach(() => { state = adminState() })

  it('CREATE_PROJECT persists all fields', () => {
    const next = reducer(state, { type: 'CREATE_PROJECT', name: 'Beta', color: '#0ea5e9' })
    const p = next.projects.find((pr) => pr.name === 'Beta')
    expect(p).toBeTruthy()
    expect(p.color).toBe('#0ea5e9')
    expect(p.members).toContain('u1')
  })

  it('CREATE_CATEGORY persists all fields', () => {
    const next = reducer(state, { type: 'CREATE_CATEGORY', name: 'Bug', color: '#ef4444' })
    const c = next.categories.find((cat) => cat.name === 'Bug')
    expect(c).toBeTruthy()
    expect(c.color).toBe('#ef4444')
  })
})

describe('persistence – profiles & team', () => {
  let state
  beforeEach(() => { state = adminState() })

  it('CREATE_PROFILE persists profile with permissions', () => {
    const next = reducer(state, { type: 'CREATE_PROFILE', name: 'QA', level: 'member', permissions: ['view_tasks'] })
    const p = next.profiles.find((pr) => pr.name === 'QA')
    expect(p).toBeTruthy()
    expect(p.permissions).toEqual(['view_tasks'])
    expect(p.level).toBe('member')
  })

  it('UPDATE_ACCESS_PROFILE persists name change', () => {
    const next = reducer(state, { type: 'UPDATE_ACCESS_PROFILE', profileId: 'pr2', patch: { name: 'Senior Dev' } })
    expect(next.profiles.find((p) => p.id === 'pr2').name).toBe('Senior Dev')
  })

  it('ADD_USER persists user with all fields', () => {
    const next = reducer(state, { type: 'ADD_USER', name: 'Carla', role: 'QA' })
    expect(next.users.length).toBe(3)
    const u = next.users.find((u) => u.name === 'Carla')
    expect(u.role).toBe('QA')
    expect(u.active).toBe(true)
  })

  it('DEACTIVATE_USER persists inactive status and reassigns tasks', () => {
    const next = reducer(state, { type: 'DEACTIVATE_USER', userId: 'u2', reassignTo: 'u1' })
    expect(next.users.find((u) => u.id === 'u2').active).toBe(false)
    expect(next.tasks.every((t) => t.assigneeId !== 'u2')).toBe(true)
  })

  it('SET_CURRENT_USER persists user switch and profile', () => {
    const next = reducer(state, { type: 'SET_CURRENT_USER', userId: 'u2' })
    expect(next.currentUserId).toBe('u2')
    expect(next.currentProfileId).toBe('pr2')
  })

  it('UPDATE_CURRENT_USER persists bio field', () => {
    const next = reducer(state, { type: 'UPDATE_CURRENT_USER', patch: { bio: 'Nova bio' } })
    const u = next.users.find((u) => u.id === 'u1')
    expect(u.bio).toBe('Nova bio')
  })
})

describe('persistence – notifications', () => {
  let state
  beforeEach(() => {
    state = adminState()
    state.notifications = [
      { id: 'n1', type: 'assign', title: 'Test', body: 'Body', targetUserId: 'u1', taskId: 't1', read: false, createdAt: '2026-08-01' },
      { id: 'n2', type: 'comment', title: 'Test2', body: 'Body2', targetUserId: 'u1', taskId: 't2', read: false, createdAt: '2026-08-02' }
    ]
  })

  it('MARK_NOTIFICATION_READ persists read status', () => {
    const next = reducer(state, { type: 'MARK_NOTIFICATION_READ', id: 'n1' })
    expect(next.notifications.find((n) => n.id === 'n1').read).toBe(true)
    expect(next.notifications.find((n) => n.id === 'n2').read).toBe(false)
  })

  it('MARK_ALL_NOTIFICATIONS_READ persists all as read', () => {
    const next = reducer(state, { type: 'MARK_ALL_NOTIFICATIONS_READ' })
    expect(next.notifications.every((n) => n.read)).toBe(true)
  })

  it('CLEAR_NOTIFICATIONS empties list', () => {
    const next = reducer(state, { type: 'CLEAR_NOTIFICATIONS' })
    expect(next.notifications.length).toBe(0)
  })
})

describe('persistence – prefs, notifPrefs, appearance (new reducer actions)', () => {
  let state
  beforeEach(() => { state = adminState() })

  it('UPDATE_PREFS persists preference changes', () => {
    const next = reducer(state, { type: 'UPDATE_PREFS', prefs: { soundAlerts: true, compactMode: true } })
    expect(next.prefs.soundAlerts).toBe(true)
    expect(next.prefs.compactMode).toBe(true)
    expect(next.prefs.emailWeekly).toBe(true) // unchanged
  })

  it('UPDATE_NOTIF_PREFS persists notification preference changes', () => {
    const next = reducer(state, { type: 'UPDATE_NOTIF_PREFS', notifPrefs: { digests: true, comments: false } })
    expect(next.notifPrefs.digests).toBe(true)
    expect(next.notifPrefs.comments).toBe(false)
    expect(next.notifPrefs.assignments).toBe(true) // unchanged
  })

  it('UPDATE_APPEARANCE persists appearance changes', () => {
    const next = reducer(state, { type: 'UPDATE_APPEARANCE', appearance: { firstDay: 'monday', language: 'en-US' } })
    expect(next.appearance.firstDay).toBe('monday')
    expect(next.appearance.language).toBe('en-US')
    expect(next.appearance.timezone).toBe('America/Sao_Paulo') // unchanged
  })

  it('UPDATE_PREFS preserves existing prefs when merging', () => {
    const next = reducer(state, { type: 'UPDATE_PREFS', prefs: { autoAssign: false } })
    expect(next.prefs.autoAssign).toBe(false)
    expect(next.prefs.emailWeekly).toBe(true)
    expect(next.prefs.soundAlerts).toBe(false)
  })
})

describe('persistence – undo/restore cycle', () => {
  let state
  beforeEach(() => { state = adminState() })

  it('delete → restore preserves all task fields', () => {
    let next = reducer(state, { type: 'DELETE_TASK', taskId: 't1', actorId: 'u1' })
    expect(next.tasks.length).toBe(1)
    expect(next.trash.length).toBe(1)

    next = reducer(next, { type: 'RESTORE_TASK', taskId: 't1', actorId: 'u1' })
    expect(next.tasks.length).toBe(2)
    expect(next.trash.length).toBe(0)

    const restored = next.tasks.find((t) => t.id === 't1')
    expect(restored.title).toBe('Task 1')
    expect(restored.description).toBe('Desc')
    expect(restored.status).toBe('todo')
    expect(restored.priority).toBe('high')
    expect(restored.assigneeId).toBe('u2')
    expect(restored.projectId).toBe('p1')
    expect(restored.categoryId).toBe('c1')
    expect(restored.dueDate).toBe('2026-09-01')
    expect(restored.estimatedHours).toBe(8)
    expect(restored.tags).toEqual(['bug'])
  })

  it('delete → restore preserves comments', () => {
    let next = reducer(state, { type: 'DELETE_TASK', taskId: 't1', actorId: 'u1' })
    expect(next.comments.t1).toBeUndefined()

    next = reducer(next, { type: 'RESTORE_TASK', taskId: 't1', actorId: 'u1' })
    expect(next.comments.t1).toHaveLength(1)
    expect(next.comments.t1[0].text).toBe('Comment')
  })
})

describe('persistence – settings page defaults', () => {
  it('default prefs are all present', () => {
    const state = adminState()
    expect(state.prefs).toEqual({
      emailWeekly: true,
      emailMentions: true,
      soundAlerts: false,
      compactMode: false,
      autoAssign: true
    })
  })

  it('default notifPrefs are all present', () => {
    const state = adminState()
    expect(state.notifPrefs).toEqual({
      assignments: true,
      mentions: true,
      dueDates: true,
      statusChanges: true,
      comments: true,
      digests: false
    })
  })

  it('default appearance has language, timezone, firstDay', () => {
    const state = adminState()
    expect(state.appearance).toEqual({
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      firstDay: 'sunday'
    })
  })
})

describe('persistence – cross-field integrity', () => {
  let state
  beforeEach(() => { state = adminState() })

  it('CANCEL_TASK persists cancelReason and canceledBy', () => {
    const next = reducer(state, { type: 'CANCEL_TASK', taskId: 't1', reason: 'Out of scope', actorId: 'u1' })
    const task = next.tasks.find((t) => t.id === 't1')
    expect(task.status).toBe('cancelled')
    expect(task.cancelReason).toBe('Out of scope')
    expect(task.canceledBy).toBe('u1')
  })

  it('APPROVE_TASK persists status=done', () => {
    state.tasks[1].status = 'review'
    const next = reducer(state, { type: 'APPROVE_TASK', taskId: 't2', actorId: 'u1' })
    expect(next.tasks.find((t) => t.id === 't2').status).toBe('done')
  })

  it('RETURN_TASK persists status=in_progress', () => {
    state.tasks[1].status = 'review'
    const next = reducer(state, { type: 'RETURN_TASK', taskId: 't2', reason: 'Needs fix', actorId: 'u1' })
    const task = next.tasks.find((t) => t.id === 't2')
    expect(task.status).toBe('in_progress')
  })

  it('theme persists across state', () => {
    const next = reducer(state, { type: 'SET_THEME', theme: 'dark' })
    expect(next.theme).toBe('dark')
  })
})
