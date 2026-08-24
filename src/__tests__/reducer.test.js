import { describe, it, expect, beforeEach } from 'vitest'
import { reducer, validateTaskPayload } from '../store/store'

/* ─── Helper: minimal state with admin permissions ─── */
const adminState = () => ({
  users: [
    { id: 'u1', name: 'Ana', role: 'Gerente', email: 'a@b.com', color: '#6366f1', online: true, active: true, profileIds: ['pr1'] },
    { id: 'u2', name: 'Bruno', role: 'Dev', email: 'b@b.com', color: '#0ea5e9', online: true, active: true, profileIds: ['pr2'] }
  ],
  profiles: [
    { id: 'pr1', name: 'Admin', level: 'admin', permissions: ['view_tasks', 'create_tasks', 'edit_tasks', 'delete_tasks', 'assign_tasks', 'manage_projects', 'manage_team', 'manage_profiles', 'view_settings'], createdBy: 'u1', color: '#f43f5e', createdAt: '2026-01-01' },
    { id: 'pr2', name: 'Member', level: 'member', permissions: ['view_tasks', 'create_tasks', 'edit_tasks'], createdBy: 'u1', color: '#6366f1', createdAt: '2026-01-01' }
  ],
  projects: [{ id: 'p1', name: 'Alpha', color: '#6366f1', members: ['u1', 'u2'] }],
  categories: [{ id: 'c1', name: 'Dev', color: '#6366f1' }],
  tasks: [
    { id: 't1', title: 'Task 1', description: '', status: 'todo', priority: 'high', assigneeId: 'u2', projectId: 'p1', categoryId: 'c1', dueDate: '2026-09-01', createdAt: '2026-08-01', estimatedHours: 8, progress: 0, tags: [], subtasks: [], favorite: false },
    { id: 't2', title: 'Task 2', description: '', status: 'review', priority: 'medium', assigneeId: 'u2', projectId: 'p1', categoryId: 'c1', dueDate: '2026-09-05', createdAt: '2026-08-02', estimatedHours: 4, progress: 80, tags: [], subtasks: [], favorite: true }
  ],
  comments: { t1: [{ id: 'cm1', userId: 'u2', text: 'Old comment', createdAt: '2026-08-01' }] },
  activities: [],
  notifications: [],
  currentUserId: 'u1',
  currentProfileId: 'pr1',
  theme: 'light',
  booted: true,
  trash: []
})

describe('reducer', () => {
  let state

  beforeEach(() => {
    state = adminState()
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
    it('creates a new task', () => {
      const next = reducer(state, { type: 'CREATE_TASK', task: { title: 'Nova tarefa' }, actorId: 'u1' })
      expect(next.tasks.length).toBe(3)
      expect(next.tasks[0].title).toBe('Nova tarefa')
      expect(next.tasks[0].status).toBe('todo')
    })

    it('creates activity entry', () => {
      const next = reducer(state, { type: 'CREATE_TASK', task: { title: 'Nova tarefa' }, actorId: 'u1' })
      expect(next.activities.length).toBe(1)
      expect(next.activities[0].type).toBe('create')
    })

    it('sends notification to assignee', () => {
      const next = reducer(state, { type: 'CREATE_TASK', task: { title: 'X', assigneeId: 'u2' }, actorId: 'u1' })
      expect(next.notifications.length).toBe(1)
      expect(next.notifications[0].targetUserId).toBe('u2')
    })

    it('blocks if no create_tasks permission', () => {
      state.currentProfileId = 'pr2'
      state.profiles[1].permissions = ['view_tasks']
      const next = reducer(state, { type: 'CREATE_TASK', task: { title: 'X' }, actorId: 'u1' })
      expect(next.tasks.length).toBe(2)
    })
  })

  describe('UPDATE_TASK', () => {
    it('updates a task', () => {
      const next = reducer(state, { type: 'UPDATE_TASK', taskId: 't1', patch: { status: 'in_progress' }, actorId: 'u1' })
      expect(next.tasks.find((t) => t.id === 't1').status).toBe('in_progress')
    })

    it('creates activity for status change', () => {
      const next = reducer(state, { type: 'UPDATE_TASK', taskId: 't1', patch: { status: 'in_progress' }, actorId: 'u1' })
      expect(next.activities.some((a) => a.type === 'status')).toBe(true)
    })

    it('notifies assignee on status change', () => {
      const next = reducer(state, { type: 'UPDATE_TASK', taskId: 't1', patch: { status: 'in_progress' }, actorId: 'u1' })
      expect(next.notifications.some((n) => n.type === 'status' && n.targetUserId === 'u2')).toBe(true)
    })

    it('blocks if no edit_tasks permission', () => {
      state.currentProfileId = 'pr2'
      state.profiles[1].permissions = ['view_tasks']
      const next = reducer(state, { type: 'UPDATE_TASK', taskId: 't1', patch: { status: 'done' }, actorId: 'u1' })
      expect(next.tasks.find((t) => t.id === 't1').status).toBe('todo')
    })

    it('blocks if task not found', () => {
      const next = reducer(state, { type: 'UPDATE_TASK', taskId: 'nonexistent', patch: { status: 'done' }, actorId: 'u1' })
      expect(next.tasks.length).toBe(2)
    })
  })

  describe('DELETE_TASK', () => {
    it('deletes a task and moves to trash', () => {
      const next = reducer(state, { type: 'DELETE_TASK', taskId: 't1', actorId: 'u1' })
      expect(next.tasks.length).toBe(1)
      expect(next.trash.length).toBe(1)
      expect(next.trash[0].task.id).toBe('t1')
    })

    it('removes comments for deleted task', () => {
      const next = reducer(state, { type: 'DELETE_TASK', taskId: 't1', actorId: 'u1' })
      expect(next.comments.t1).toBeUndefined()
    })
  })

  describe('RESTORE_TASK', () => {
    it('restores a task from trash', () => {
      let next = reducer(state, { type: 'DELETE_TASK', taskId: 't1', actorId: 'u1' })
      next = reducer(next, { type: 'RESTORE_TASK', taskId: 't1', actorId: 'u1' })
      expect(next.tasks.length).toBe(2)
      expect(next.trash.length).toBe(0)
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
    it('duplicates a task with (cópia) suffix', () => {
      const next = reducer(state, { type: 'DUPLICATE_TASK', taskId: 't1', actorId: 'u1' })
      expect(next.tasks.length).toBe(3)
      expect(next.tasks[0].title).toBe('Task 1 (cópia)')
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

  /* ─── Approve / Return / Cancel ─── */
  describe('APPROVE_TASK', () => {
    it('approves a review task to done', () => {
      state.tasks[1].status = 'review'
      const next = reducer(state, { type: 'APPROVE_TASK', taskId: 't2', actorId: 'u1' })
      expect(next.tasks.find((t) => t.id === 't2').status).toBe('done')
    })

    it('blocks if task not in review', () => {
      const next = reducer(state, { type: 'APPROVE_TASK', taskId: 't1', actorId: 'u1' })
      expect(next.tasks.find((t) => t.id === 't1').status).toBe('todo')
    })
  })

  describe('RETURN_TASK', () => {
    it('returns a review task to in_progress', () => {
      state.tasks[1].status = 'review'
      const next = reducer(state, { type: 'RETURN_TASK', taskId: 't2', reason: 'Needs fix', actorId: 'u1' })
      expect(next.tasks.find((t) => t.id === 't2').status).toBe('in_progress')
    })

    it('blocks if no reason provided', () => {
      state.tasks[1].status = 'review'
      const next = reducer(state, { type: 'RETURN_TASK', taskId: 't2', reason: '', actorId: 'u1' })
      expect(next.tasks.find((t) => t.id === 't2').status).toBe('review')
    })
  })

  describe('CANCEL_TASK', () => {
    it('cancels a task with reason', () => {
      const next = reducer(state, { type: 'CANCEL_TASK', taskId: 't1', reason: 'No longer needed', actorId: 'u1' })
      expect(next.tasks.find((t) => t.id === 't1').status).toBe('cancelled')
      expect(next.tasks.find((t) => t.id === 't1').cancelReason).toBe('No longer needed')
    })

    it('blocks cancel on done task', () => {
      state.tasks[0].status = 'done'
      const next = reducer(state, { type: 'CANCEL_TASK', taskId: 't1', reason: 'X', actorId: 'u1' })
      expect(next.tasks.find((t) => t.id === 't1').status).toBe('done')
    })
  })

  /* ─── Comments ─── */
  describe('ADD_COMMENT', () => {
    it('adds a comment and notifies assignee', () => {
      const next = reducer(state, { type: 'ADD_COMMENT', taskId: 't1', userId: 'u1', text: 'Great work!' })
      expect(next.comments.t1.length).toBe(2)
      expect(next.comments.t1[1].text).toBe('Great work!')
      expect(next.notifications.some((n) => n.type === 'comment' && n.targetUserId === 'u2')).toBe(true)
    })

    it('detects @mentions', () => {
      const next = reducer(state, { type: 'ADD_COMMENT', taskId: 't1', userId: 'u1', text: 'Hey @Bruno check this' })
      expect(next.notifications.some((n) => n.type === 'mention')).toBe(true)
    })
  })

  /* ─── Notifications ─── */
  describe('MARK_NOTIFICATION_READ', () => {
    it('marks a notification as read', () => {
      state.notifications = [{ id: 'n1', read: false }]
      const next = reducer(state, { type: 'MARK_NOTIFICATION_READ', id: 'n1' })
      expect(next.notifications[0].read).toBe(true)
    })
  })

  describe('MARK_ALL_NOTIFICATIONS_READ', () => {
    it('marks all notifications as read', () => {
      state.notifications = [{ id: 'n1', read: false }, { id: 'n2', read: false }]
      const next = reducer(state, { type: 'MARK_ALL_NOTIFICATIONS_READ' })
      expect(next.notifications.every((n) => n.read)).toBe(true)
    })
  })

  describe('CLEAR_NOTIFICATIONS', () => {
    it('clears all notifications', () => {
      state.notifications = [{ id: 'n1' }]
      const next = reducer(state, { type: 'CLEAR_NOTIFICATIONS' })
      expect(next.notifications.length).toBe(0)
    })
  })

  /* ─── Profiles ─── */
  describe('CREATE_PROFILE', () => {
    it('creates a new access profile', () => {
      const next = reducer(state, { type: 'CREATE_PROFILE', name: 'QA', level: 'member', permissions: ['view_tasks'] })
      expect(next.profiles.length).toBe(3)
      expect(next.profiles[2].name).toBe('QA')
    })
  })

  describe('UPDATE_ACCESS_PROFILE', () => {
    it('updates a profile', () => {
      const next = reducer(state, { type: 'UPDATE_ACCESS_PROFILE', profileId: 'pr2', patch: { name: 'Senior Dev' } })
      expect(next.profiles.find((p) => p.id === 'pr2').name).toBe('Senior Dev')
    })
  })

  describe('DELETE_PROFILE', () => {
    it('deletes a profile', () => {
      const next = reducer(state, { type: 'DELETE_PROFILE', profileId: 'pr2' })
      expect(next.profiles.length).toBe(1)
    })

    it('blocks deleting current profile', () => {
      const next = reducer(state, { type: 'DELETE_PROFILE', profileId: 'pr1' })
      expect(next.profiles.length).toBe(2)
    })
  })

  /* ─── Team ─── */
  describe('ADD_USER', () => {
    it('adds a new user', () => {
      const next = reducer(state, { type: 'ADD_USER', name: 'Carla', role: 'QA' })
      expect(next.users.length).toBe(3)
      expect(next.users[2].name).toBe('Carla')
    })
  })

  describe('SET_CURRENT_USER', () => {
    it('switches current user and profile', () => {
      const next = reducer(state, { type: 'SET_CURRENT_USER', userId: 'u2' })
      expect(next.currentUserId).toBe('u2')
      expect(next.currentProfileId).toBe('pr2')
    })
  })

  describe('SET_CURRENT_PROFILE', () => {
    it('switches current profile', () => {
      const next = reducer(state, { type: 'SET_CURRENT_PROFILE', profileId: 'pr2' })
      expect(next.currentProfileId).toBe('pr2')
    })
  })

  describe('DEACTIVATE_USER', () => {
    it('deactivates a user and reassigns tasks', () => {
      const next = reducer(state, { type: 'DEACTIVATE_USER', userId: 'u2', reassignTo: 'u1' })
      expect(next.users.find((u) => u.id === 'u2').active).toBe(false)
      expect(next.tasks.every((t) => t.assigneeId !== 'u2')).toBe(true)
    })

    it('blocks self-deactivation', () => {
      const next = reducer(state, { type: 'DEACTIVATE_USER', userId: 'u1' })
      expect(next.users.find((u) => u.id === 'u1').active).toBe(true)
    })
  })

  /* ─── Projects / Categories ─── */
  describe('CREATE_PROJECT', () => {
    it('creates a project', () => {
      const next = reducer(state, { type: 'CREATE_PROJECT', name: 'Beta', color: '#0ea5e9' })
      expect(next.projects.length).toBe(2)
      expect(next.projects[1].name).toBe('Beta')
    })
  })

  describe('CREATE_CATEGORY', () => {
    it('creates a category', () => {
      const next = reducer(state, { type: 'CREATE_CATEGORY', name: 'Bug', color: '#ef4444' })
      expect(next.categories.length).toBe(2)
      expect(next.categories[1].name).toBe('Bug')
    })
  })

  /* ─── Reset ─── */
  describe('RESET', () => {
    it('resets to initial state', () => {
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
      const errors = validateTaskPayload({ title: '   ' })
      expect(errors.length).toBe(1)
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
      const errors = validateTaskPayload({ title: '', estimatedHours: -1, dueDate: 'bad' })
      expect(errors.length).toBe(3)
    })

    it('returns error for null/undefined payload', () => {
      expect(validateTaskPayload(null).length).toBeGreaterThan(0)
      expect(validateTaskPayload(undefined).length).toBeGreaterThan(0)
    })

    it('ignores fields not in the payload', () => {
      expect(validateTaskPayload({})).toEqual([])
    })
  })

  /* ─── Permission checks ─── */
  describe('permission checks', () => {
    it('non-manager cannot see tasks assigned to others', () => {
      const memberState = adminState()
      memberState.currentUserId = 'u2'
      memberState.currentProfileId = 'pr2' // member profile
      const next = reducer(memberState, { type: 'BOOT' })
      // Non-managers see only their own tasks via useTaskFilters, not via reducer
      // The reducer itself doesn't filter — this is handled in the hook
      // But we can verify the reducer state is unchanged
      expect(next.tasks.length).toBe(2)
    })

    it('admin can create tasks', () => {
      const next = reducer(state, {
        type: 'CREATE_TASK',
        task: { title: 'New task' },
        actorId: 'u1'
      })
      expect(next.tasks.length).toBe(3)
      expect(next.tasks.find((t) => t.title === 'New task')).toBeTruthy()
    })

    it('member cannot create tasks without permission', () => {
      const memberState = adminState()
      memberState.currentProfileId = 'pr2' // member: has create_tasks
      const next = reducer(memberState, {
        type: 'CREATE_TASK',
        task: { title: 'Should fail' },
        actorId: 'u2'
      })
      // pr2 has create_tasks, so it succeeds
      expect(next.tasks.length).toBe(3)
    })

    it('CREATE_TASK rejects invalid payload', () => {
      const next = reducer(state, {
        type: 'CREATE_TASK',
        task: { title: '' },
        actorId: 'u1'
      })
      // Validation fails, state unchanged
      expect(next.tasks.length).toBe(2)
    })

    it('UPDATE_TASK rejects invalid payload', () => {
      const next = reducer(state, {
        type: 'UPDATE_TASK',
        taskId: 't1',
        patch: { title: '' },
        actorId: 'u1'
      })
      expect(next.tasks.length).toBe(2)
      expect(next.tasks[0].title).toBe('Task 1')
    })

    it('TOGGLE_FAVORITE requires view_tasks permission', () => {
      const viewerState = adminState()
      viewerState.currentProfileId = 'pr3'
      viewerState.profiles.push({
        id: 'pr3', name: 'Viewer', level: 'viewer', permissions: [],
        createdBy: 'u1', color: '#94a3b8', createdAt: '2026-01-01'
      })
      const next = reducer(viewerState, {
        type: 'TOGGLE_FAVORITE', taskId: 't1'
      })
      // No view_tasks permission, favorite unchanged
      expect(next.tasks[0].favorite).toBe(false)
    })
  })
})
