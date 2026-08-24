import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer
} from 'react'
import { MOCK_STATE, CURRENT_USER_ID, CURRENT_PROFILE_ID } from '../data/mock'
import { STATUS, PRIORITY, AVATAR_COLORS } from '../lib/constants'
import { formatDate } from '../lib/format'

const StoreContext = createContext(null)

const PERSIST_KEY = 'taskflow-state-v1'
const PERSIST_VERSION = 1

let seq = 0
const nextSeq = () => ++seq

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(PERSIST_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw)
    if (
      saved.__v !== PERSIST_VERSION ||
      !Array.isArray(saved.tasks) ||
      !Array.isArray(saved.users) ||
      !Array.isArray(saved.profiles) ||
      !Array.isArray(saved.projects)
    ) {
      return null
    }
    const { __v, ...rest } = saved
    return { ...rest, booted: true }
  } catch {
    return null
  }
}

const initialState = () => {
  const persisted = loadPersistedState()
  if (persisted) return persisted
  return {
    ...MOCK_STATE,
    currentUserId: CURRENT_USER_ID,
    currentProfileId: CURRENT_PROFILE_ID,
    theme: localStorage.getItem('taskflow-theme') || 'light',
    booted: false,
    trash: [],
    persistedActivitySeq: MOCK_STATE.activities.length
  }
}

export { initialState }

const userById = (state, id) => state.users.find((u) => u.id === id)

function activityEntry(state, { type, actorId, taskId, text }) {
  const actor = userById(state, actorId)
  const actorName = actor ? actor.name : 'Alguém'
  return {
    id: `act-${Date.now()}-${nextSeq()}`,
    type,
    actorId,
    taskId,
    text: `${actorName} ${text}`,
    createdAt: new Date().toISOString()
  }
}

function notificationEntry(state, { type, title, body, taskId, targetUserId }) {
  return {
    id: `notif-${Date.now()}-${nextSeq()}`,
    type,
    title,
    body,
    targetUserId,
    taskId,
    read: false,
    createdAt: new Date().toISOString()
  }
}

function makeChangeActivities(state, task, patch, actorId) {
  const acts = []
  const old = task
  if (patch.status && patch.status !== old.status) {
    acts.push(
      activityEntry(state, {
        type: 'status',
        actorId,
        taskId: old.id,
        text: `mudou o status de "${old.title}" para ${STATUS[patch.status].label}`
      })
    )
  }
  if (patch.priority && patch.priority !== old.priority) {
    const dir = PRIORITY[patch.priority].rank > PRIORITY[old.priority].rank ? 'aumentou' : 'reduziu'
    acts.push(
      activityEntry(state, {
        type: 'priority',
        actorId,
        taskId: old.id,
        text: `${dir} a prioridade de "${old.title}" para ${PRIORITY[patch.priority].label}`
      })
    )
  }
  if ('assigneeId' in patch && patch.assigneeId !== old.assigneeId) {
    if (patch.assigneeId) {
      const u = userById(state, patch.assigneeId)
      acts.push(
        activityEntry(state, {
          type: 'assign',
          actorId,
          taskId: old.id,
          text: `atribuiu "${old.title}" a ${u ? u.name : 'um membro'}`
        })
      )
    } else {
      acts.push(
        activityEntry(state, {
          type: 'assign',
          actorId,
          taskId: old.id,
          text: `removeu a atribuição de "${old.title}"`
        })
      )
    }
  }
  if ('dueDate' in patch && patch.dueDate !== old.dueDate) {
    acts.push(
      activityEntry(state, {
        type: 'due',
        actorId,
        taskId: old.id,
        text: patch.dueDate
          ? `alterou o vencimento de "${old.title}" para ${formatDate(patch.dueDate)}`
          : `removeu o vencimento de "${old.title}"`
      })
    )
  }
  if ('projectId' in patch && patch.projectId !== old.projectId) {
    const p = state.projects.find((pr) => pr.id === patch.projectId)
    acts.push(
      activityEntry(state, {
        type: 'project',
        actorId,
        taskId: old.id,
        text: p
          ? `moveu "${old.title}" para o projeto ${p.name}`
          : `removeu "${old.title}" do projeto`
      })
    )
  }
  if ('categoryId' in patch && patch.categoryId !== old.categoryId) {
    const c = state.categories.find((cat) => cat.id === patch.categoryId)
    acts.push(
      activityEntry(state, {
        type: 'category',
        actorId,
        taskId: old.id,
        text: c
          ? `alterou a categoria de "${old.title}" para ${c.name}`
          : `removeu a categoria de "${old.title}"`
      })
    )
  }
  if (patch.title && patch.title !== old.title) {
    acts.push(
      activityEntry(state, {
        type: 'title',
        actorId,
        taskId: old.id,
        text: `renomeou a tarefa "${old.title}" para "${patch.title}"`
      })
    )
  }
  return acts
}

function profileCan(state, perm) {
  const profile = state.profiles.find((p) => p.id === state.currentProfileId)
  return Boolean(profile && profile.permissions.includes(perm))
}

function activeProfile(state) {
  return state.profiles.find((p) => p.id === state.currentProfileId)
}

function isManagerLevel(state) {
  const profile = activeProfile(state)
  return Boolean(profile && (profile.level === 'manager' || profile.level === 'admin'))
}

function canModifyTask(state, task) {
  if (isManagerLevel(state)) return true
  return Boolean(task && task.assigneeId === state.currentUserId)
}

function canReassign(state) {
  return isManagerLevel(state) && profileCan(state, 'assign_tasks')
}

function mentionTargets(state, text, fromUserId) {
  const lower = String(text || '').toLowerCase()
  return state.users
    .filter((u) => u.id !== fromUserId && u.active !== false)
    .filter((u) => {
      const firstName = u.name.split(' ')[0].toLowerCase()
      const fullName = u.name.toLowerCase()
      return lower.includes(`@${firstName}`) || lower.includes(`@${fullName}`)
    })
    .map((u) => u.id)
}

function validateTaskPayload(task) {
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

function reducer(state, action) {
  switch (action.type) {
    case 'BOOT': {
      const notifs = [...state.notifications]
      const now = Date.now()
      const day = 24 * 60 * 60 * 1000
      const has = (type, taskId, targetUserId) =>
        notifs.some(
          (n) => n.type === type && n.taskId === taskId && n.targetUserId === targetUserId
        )
      const isManager = (u) =>
        (u.profileIds || []).some((pid) => {
          const p = state.profiles.find((x) => x.id === pid)
          return p && (p.level === 'manager' || p.level === 'admin')
        })
      state.tasks.forEach((t) => {
        if (!t.dueDate || t.status === 'done' || t.status === 'cancelled') return
        const diff = new Date(t.dueDate).getTime() - now
        if (diff < 0) {
          if (t.assigneeId && !has('due', t.id, t.assigneeId)) {
            notifs.push(
              notificationEntry(state, {
                type: 'due',
                title: 'Tarefa atrasada',
                body: `"${t.title}" está atrasada.`,
                taskId: t.id,
                targetUserId: t.assigneeId
              })
            )
          }
          state.users
            .filter((u) => u.id !== t.assigneeId && u.active !== false && isManager(u))
            .forEach((m) => {
              if (!has('due', t.id, m.id)) {
                notifs.push(
                  notificationEntry(state, {
                    type: 'due',
                    title: 'Tarefa atrasada',
                    body: `"${t.title}" está atrasada.`,
                    taskId: t.id,
                    targetUserId: m.id
                  })
                )
              }
            })
        } else if (diff <= 3 * day) {
          if (t.assigneeId && !has('due', t.id, t.assigneeId)) {
            const days = Math.max(1, Math.ceil(diff / day))
            notifs.push(
              notificationEntry(state, {
                type: 'due',
                title: 'Vencimento próximo',
                body: `"${t.title}" vence em ${days} dia(s).`,
                taskId: t.id,
                targetUserId: t.assigneeId
              })
            )
          }
        }
      })
      return { ...state, booted: true, notifications: notifs }
    }
    case 'SET_THEME': {
      return { ...state, theme: action.theme }
    }
    case 'CREATE_TASK': {
      if (!profileCan(state, 'create_tasks')) return state
      const validationErrors = validateTaskPayload(action.task)
      if (validationErrors.length > 0) return state
      const task = {
        id: `t-${Date.now()}-${nextSeq()}`,
        title: action.task.title,
        description: action.task.description || '',
        status: action.task.status || 'todo',
        priority: action.task.priority || 'medium',
        assigneeId: action.task.assigneeId || null,
        projectId: action.task.projectId || null,
        categoryId: action.task.categoryId || 'c1',
        dueDate: action.task.dueDate || null,
        createdAt: new Date().toISOString(),
        estimatedHours: Number(action.task.estimatedHours) || 0,
        progress: 0,
        tags: action.task.tags || [],
        subtasks: [],
        favorite: Boolean(action.task.favorite)
      }
      const acts = [
        activityEntry(state, {
          type: 'create',
          actorId: action.actorId,
          taskId: task.id,
          text: `criou a tarefa "${task.title}"`
        })
      ]
      const notifs = []
      if (task.assigneeId && task.assigneeId !== action.actorId) {
        notifs.push(
          notificationEntry(state, {
            type: 'assign',
            title: 'Nova tarefa atribuída',
            body: `"${task.title}" foi atribuída a você.`,
            taskId: task.id,
            targetUserId: task.assigneeId
          })
        )
      }
      return {
        ...state,
        tasks: [task, ...state.tasks],
        activities: [...acts, ...state.activities],
        notifications: [...notifs, ...state.notifications]
      }
    }
    case 'UPDATE_TASK': {
      if (!profileCan(state, 'edit_tasks')) return state
      if (action.patch) {
        const patchErrors = validateTaskPayload(action.patch)
        if (patchErrors.length > 0) return state
      }
      const idx = state.tasks.findIndex((t) => t.id === action.taskId)
      if (idx === -1) return state
      const old = state.tasks[idx]
      if (!canModifyTask(state, old)) return state
      if (
        'assigneeId' in action.patch &&
        action.patch.assigneeId !== old.assigneeId &&
        !canReassign(state)
      )
        return state
      const next = { ...old, ...action.patch }
      const acts = makeChangeActivities(state, old, action.patch, action.actorId)
      const notifs = []
      if (
        'assigneeId' in action.patch &&
        action.patch.assigneeId &&
        action.patch.assigneeId !== old.assigneeId &&
        action.patch.assigneeId !== action.actorId
      ) {
        notifs.push(
          notificationEntry(state, {
            type: 'assign',
            title: 'Tarefa atribuída a você',
            body: `"${next.title}" foi atribuída a você.`,
            taskId: next.id,
            targetUserId: action.patch.assigneeId
          })
        )
      }
      if (
        action.patch.status &&
        action.patch.status !== old.status &&
        next.assigneeId &&
        next.assigneeId !== action.actorId
      ) {
        notifs.push(
          notificationEntry(state, {
            type: 'status',
            title: next.status === 'done' ? 'Tarefa concluída' : 'Status alterado',
            body: `"${next.title}" mudou para ${STATUS[next.status].label}.`,
            taskId: next.id,
            targetUserId: next.assigneeId
          })
        )
      }
      const tasks = state.tasks.slice()
      tasks[idx] = next
      return {
        ...state,
        tasks,
        activities: [...acts, ...state.activities],
        notifications: [...notifs, ...state.notifications]
      }
    }
    case 'DELETE_TASK': {
      if (!profileCan(state, 'delete_tasks')) return state
      const task = state.tasks.find((t) => t.id === action.taskId)
      if (!task || !canModifyTask(state, task)) return state
      const acts = [
        activityEntry(state, {
          type: 'delete',
          actorId: action.actorId,
          taskId: null,
          text: `excluiu a tarefa "${task.title}"`
        })
      ]
      const comments = { ...state.comments }
      delete comments[action.taskId]
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.taskId),
        comments,
        activities: [...acts, ...state.activities],
        trash: [
          ...state.trash,
          { task, comments: state.comments[action.taskId] || [] }
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
      const comments = { ...state.comments }
      restored.forEach((r) => {
        comments[r.task.id] = r.comments
      })
      const acts = restored.map((r) =>
        activityEntry(state, {
          type: 'restore',
          actorId: action.actorId,
          taskId: r.task.id,
          text: `restaurou a tarefa "${r.task.title}"`
        })
      )
      return {
        ...state,
        tasks: [...restored.map((r) => r.task), ...state.tasks],
        comments,
        trash: state.trash.filter((entry) => !restoredIds.has(entry.task.id)),
        activities: [...acts, ...state.activities]
      }
    }
    case 'APPROVE_TASK': {
      if (!profileCan(state, 'edit_tasks')) return state
      const task = state.tasks.find((t) => t.id === action.taskId)
      if (!task || task.status !== 'review' || !canModifyTask(state, task)) return state
      const next = { ...task, status: 'done', progress: task.progress || 100 }
      const acts = [
        activityEntry(state, {
          type: 'approve',
          actorId: action.actorId,
          taskId: task.id,
          text: `aprovou a tarefa "${task.title}"`
        })
      ]
      const notifs = []
      if (next.assigneeId && next.assigneeId !== action.actorId) {
        notifs.push(
          notificationEntry(state, {
            type: 'approve',
            title: 'Tarefa aprovada',
            body: `"${next.title}" foi aprovada e concluída.`,
            taskId: next.id,
            targetUserId: next.assigneeId
          })
        )
      }
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === task.id ? next : t)),
        activities: [...acts, ...state.activities],
        notifications: [...notifs, ...state.notifications]
      }
    }
    case 'RETURN_TASK': {
      if (!profileCan(state, 'edit_tasks')) return state
      const task = state.tasks.find((t) => t.id === action.taskId)
      if (
        !task ||
        task.status !== 'review' ||
        !action.reason?.trim() ||
        !canModifyTask(state, task)
      )
        return state
      const next = { ...task, status: 'in_progress' }
      const reason = action.reason.trim()
      const acts = [
        activityEntry(state, {
          type: 'return',
          actorId: action.actorId,
          taskId: task.id,
          text: `devolveu a tarefa "${task.title}" para execução: "${reason}"`
        })
      ]
      const notifs = []
      if (next.assigneeId && next.assigneeId !== action.actorId) {
        notifs.push(
          notificationEntry(state, {
            type: 'return',
            title: 'Tarefa devolvida',
            body: `"${next.title}" foi devolvida para execução: ${reason}`,
            taskId: next.id,
            targetUserId: next.assigneeId
          })
        )
      }
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === task.id ? next : t)),
        activities: [...acts, ...state.activities],
        notifications: [...notifs, ...state.notifications]
      }
    }
    case 'CANCEL_TASK': {
      if (!profileCan(state, 'edit_tasks')) return state
      const task = state.tasks.find((t) => t.id === action.taskId)
      if (
        !task ||
        task.status === 'done' ||
        task.status === 'cancelled' ||
        !action.reason?.trim() ||
        !canModifyTask(state, task)
      )
        return state
      const reason = action.reason.trim()
      const next = { ...task, status: 'cancelled', cancelReason: reason, canceledBy: action.actorId }
      const acts = [
        activityEntry(state, {
          type: 'cancel',
          actorId: action.actorId,
          taskId: task.id,
          text: `cancelou a tarefa "${task.title}": "${reason}"`
        })
      ]
      const notifs = []
      if (next.assigneeId && next.assigneeId !== action.actorId) {
        notifs.push(
          notificationEntry(state, {
            type: 'cancel',
            title: 'Tarefa cancelada',
            body: `"${next.title}" foi cancelada: ${reason}`,
            taskId: next.id,
            targetUserId: next.assigneeId
          })
        )
      }
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === task.id ? next : t)),
        activities: [...acts, ...state.activities],
        notifications: [...notifs, ...state.notifications]
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
      if (!profileCan(state, 'create_tasks')) return state
      const source = state.tasks.find((t) => t.id === action.taskId)
      if (!source) return state
      const copy = {
        ...source,
        id: `t-${Date.now()}-${nextSeq()}`,
        title: `${source.title} (cópia)`,
        createdAt: new Date().toISOString(),
        progress: 0,
        subtasks: (source.subtasks || []).map((s) => ({
          ...s,
          id: `s-${Date.now()}-${nextSeq()}`,
          done: false
        }))
      }
      const acts = [
        activityEntry(state, {
          type: 'create',
          actorId: action.actorId,
          taskId: copy.id,
          text: `duplicou a tarefa "${source.title}" para "${copy.title}"`
        })
      ]
      return {
        ...state,
        tasks: [copy, ...state.tasks],
        activities: [...acts, ...state.activities]
      }
    }
    case 'TOGGLE_SUBTASK': {
      if (!profileCan(state, 'edit_tasks')) return state
      const target = state.tasks.find((t) => t.id === action.taskId)
      if (!target || !canModifyTask(state, target)) return state
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
    case 'ADD_COMMENT': {
      if (!profileCan(state, 'edit_tasks')) return state
      const task = state.tasks.find((t) => t.id === action.taskId)
      if (!task || !canModifyTask(state, task)) return state
      const comments = {
        ...state.comments,
        [action.taskId]: [
          ...(state.comments[action.taskId] || []),
          {
            id: `cm-${Date.now()}-${nextSeq()}`,
            userId: action.userId,
            text: action.text,
            createdAt: new Date().toISOString()
          }
        ]
      }
      const acts = [
        activityEntry(state, {
          type: 'comment',
          actorId: action.userId,
          taskId: action.taskId,
          text: `comentou em "${task ? task.title : 'uma tarefa'}"`
        })
      ]
      const notifs = []
      if (task && task.assigneeId && task.assigneeId !== action.userId) {
        notifs.push(
          notificationEntry(state, {
            type: 'comment',
            title: 'Novo comentário',
            body: `Houve um novo comentário em "${task.title}".`,
            taskId: action.taskId,
            targetUserId: task.assigneeId
          })
        )
      }
      mentionTargets(state, action.text, action.userId).forEach((uid) => {
        notifs.push(
          notificationEntry(state, {
            type: 'mention',
            title: 'Você foi mencionado',
            body: `${userById(state, action.userId)?.name || 'Alguém'} mencionou você em "${task.title}".`,
            taskId: action.taskId,
            targetUserId: uid
          })
        )
      })
      return {
        ...state,
        comments,
        activities: [...acts, ...state.activities],
        notifications: [...notifs, ...state.notifications]
      }
    }
    case 'MARK_NOTIFICATION_READ': {
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.id ? { ...n, read: true } : n
        )
      }
    }
    case 'MARK_ALL_NOTIFICATIONS_READ': {
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true }))
      }
    }
    case 'CLEAR_NOTIFICATIONS': {
      return { ...state, notifications: [] }
    }
    case 'CREATE_PROJECT': {
      const project = {
        id: `p-${Date.now()}-${nextSeq()}`,
        name: action.name,
        description: action.description || '',
        color: action.color || '#6366f1',
        members: [state.currentUserId],
        due: action.due ? new Date(action.due).toISOString() : null
      }
      const acts = [
        activityEntry(state, {
          type: 'project',
          actorId: state.currentUserId,
          taskId: null,
          text: `criou o projeto "${project.name}"`
        })
      ]
      return {
        ...state,
        projects: [...state.projects, project],
        activities: [...acts, ...state.activities]
      }
    }
    case 'CREATE_CATEGORY': {
      const category = {
        id: `c-${Date.now()}-${nextSeq()}`,
        name: action.name,
        color: action.color || '#94a3b8'
      }
      const acts = [
        activityEntry(state, {
          type: 'category',
          actorId: state.currentUserId,
          taskId: null,
          text: `criou a categoria "${category.name}"`
        })
      ]
      return {
        ...state,
        categories: [...state.categories, category],
        activities: [...acts, ...state.activities]
      }
    }
    case 'UPDATE_CURRENT_USER': {
      const user = state.users.find((u) => u.id === state.currentUserId)
      const acts = user
        ? [
            activityEntry(state, {
              type: 'profile',
              actorId: state.currentUserId,
              taskId: null,
              text: `atualizou o próprio perfil`
            })
          ]
        : []
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === state.currentUserId ? { ...u, ...action.patch } : u
        ),
        activities: [...acts, ...state.activities]
      }
    }
    case 'ADD_USER': {
      if (!profileCan(state, 'manage_team')) return state
      const user = {
        id: `u-${Date.now()}-${nextSeq()}`,
        name: action.name || 'Novo membro',
        role: action.role || 'Desenvolvedor Frontend',
        email: action.email || '',
        color: action.color || AVATAR_COLORS[state.users.length % AVATAR_COLORS.length],
        online: true
      }
      const acts = [
        activityEntry(state, {
          type: 'team',
          actorId: state.currentUserId,
          taskId: null,
          text: `convidou ${user.name} para a equipe`
        })
      ]
      return {
        ...state,
        users: [...state.users, user],
        activities: [...acts, ...state.activities]
      }
    }
    case 'CREATE_PROFILE': {
      const profile = {
        id: `pr-${Date.now()}-${nextSeq()}`,
        name: action.name,
        description: action.description || '',
        level: action.level || 'member',
        permissions: action.permissions || [],
        createdBy: state.currentUserId,
        color: action.color || '#6366f1',
        createdAt: new Date().toISOString()
      }
      const acts = [
        activityEntry(state, {
          type: 'profile',
          actorId: state.currentUserId,
          taskId: null,
          text: `criou o perfil de acesso "${profile.name}"`
        })
      ]
      return {
        ...state,
        profiles: [...state.profiles, profile],
        activities: [...acts, ...state.activities]
      }
    }
    case 'UPDATE_ACCESS_PROFILE': {
      const idx = state.profiles.findIndex((p) => p.id === action.profileId)
      if (idx === -1) return state
      const profiles = state.profiles.slice()
      profiles[idx] = { ...profiles[idx], ...action.patch }
      const profile = profiles[idx]
      const acts = [
        activityEntry(state, {
          type: 'profile',
          actorId: state.currentUserId,
          taskId: null,
          text: `atualizou o perfil de acesso "${profile.name}"`
        })
      ]
      return { ...state, profiles, activities: [...acts, ...state.activities] }
    }
    case 'DELETE_PROFILE': {
      const profile = state.profiles.find((p) => p.id === action.profileId)
      if (!profile) return state
      if (state.currentProfileId === action.profileId) return state
      const acts = [
        activityEntry(state, {
          type: 'profile',
          actorId: state.currentUserId,
          taskId: null,
          text: `excluiu o perfil de acesso "${profile.name}"`
        })
      ]
      return {
        ...state,
        profiles: state.profiles.filter((p) => p.id !== action.profileId),
        activities: [...acts, ...state.activities]
      }
    }
    case 'SET_CURRENT_USER': {
      const user = state.users.find((u) => u.id === action.userId)
      if (!user) return state
      const firstProfile = (user.profileIds || [])[0]
      const currentProfileId =
        firstProfile && state.profiles.some((p) => p.id === firstProfile)
          ? firstProfile
          : state.currentProfileId
      return { ...state, currentUserId: action.userId, currentProfileId }
    }
    case 'DEACTIVATE_USER': {
      if (!profileCan(state, 'manage_team')) return state
      const user = state.users.find((u) => u.id === action.userId)
      if (!user || user.id === state.currentUserId) return state
      const reassignTo = action.reassignTo || null
      const tasks = state.tasks.map((t) =>
        t.assigneeId === action.userId ? { ...t, assigneeId: reassignTo } : t
      )
      const projects = state.projects.map((p) =>
        p.members.includes(action.userId)
          ? { ...p, members: p.members.filter((m) => m !== action.userId) }
          : p
      )
      const users = state.users.map((u) =>
        u.id === action.userId ? { ...u, active: false, online: false } : u
      )
      const target = reassignTo ? userById(state, reassignTo) : null
      const acts = [
        activityEntry(state, {
          type: 'team',
          actorId: state.currentUserId,
          taskId: null,
          text: `inativou ${user.name} e ${
            target ? `reatribuiu as tarefas para ${target.name}` : 'removeu suas tarefas'
          }`
        })
      ]
      return {
        ...state,
        users,
        tasks,
        projects,
        activities: [...acts, ...state.activities]
      }
    }
    case 'SET_CURRENT_PROFILE': {
      const profile = state.profiles.find((p) => p.id === action.profileId)
      if (!profile) return state
      const current = state.profiles.find((p) => p.id === state.currentProfileId)
      if (current && current.id === profile.id) return state
      const acts = [
        activityEntry(state, {
          type: 'profile',
          actorId: state.currentUserId,
          taskId: null,
          text: `ativou o perfil de acesso "${profile.name}"`
        })
      ]
      return {
        ...state,
        currentProfileId: action.profileId,
        activities: [...acts, ...state.activities]
      }
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
    const t = setTimeout(() => dispatch({ type: 'BOOT' }), 650)
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
      } catch {
        // ignora erros de cota/privacidade (localStorage indisponível)
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

export function useCurrentUser() {
  const { state } = useStore()
  return state.users.find((u) => u.id === state.currentUserId)
}

export function useActiveProfile() {
  const { state } = useStore()
  return useMemo(
    () =>
      state.profiles.find((p) => p.id === state.currentProfileId) || state.profiles[0],
    [state.profiles, state.currentProfileId]
  )
}

export function useCan() {
  const activeProfile = useActiveProfile()
  return useMemo(() => {
    const perms = activeProfile?.permissions || []
    return (perm) => perms.includes(perm)
  }, [activeProfile])
}

export function useIsManager() {
  const activeProfile = useActiveProfile()
  return useMemo(
    () => Boolean(activeProfile && (activeProfile.level === 'manager' || activeProfile.level === 'admin')),
    [activeProfile]
  )
}

export function useCanReassign() {
  const can = useCan()
  const isManager = useIsManager()
  return useMemo(() => isManager && can('assign_tasks'), [isManager, can])
}

export function useCanModifyTask() {
  const { state } = useStore()
  const isManager = useIsManager()
  return useMemo(
    () => (task) => Boolean(task) && (isManager || task.assigneeId === state.currentUserId),
    [isManager, state.currentUserId]
  )
}

export function useTaskById(taskId) {
  const { state } = useStore()
  return useMemo(() => state.tasks.find((t) => t.id === taskId), [state.tasks, taskId])
}

export function useTaskComments(taskId) {
  const { state } = useStore()
  return useMemo(() => state.comments[taskId] || [], [state.comments, taskId])
}
