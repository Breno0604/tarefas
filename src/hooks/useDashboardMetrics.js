import { useMemo } from 'react'
import { useStore } from '../store/store'
import { STATUS, PRIORITY } from '../lib/constants'
import { isOverdue, startOfDay, endOfDay } from '../lib/format'

/**
 * Centralized dashboard metrics — replaces 8+ inline useMemo calls
 * in the Dashboard page with a single composable hook.
 */
export default function useDashboardMetrics() {
  const { state } = useStore()
  const tasks = state.tasks

  const metrics = useMemo(() => {
    const open = tasks.filter((t) => t.status === 'todo' || t.status === 'in_progress')
    const done = tasks.filter((t) => t.status === 'done')
    const overdue = tasks.filter((t) => isOverdue(t.dueDate, t.status))
    const start = startOfDay().getTime()
    const end = endOfDay().getTime()
    const dueToday = open.filter((t) => {
      if (!t.dueDate) return false
      const ts = new Date(t.dueDate).getTime()
      return ts >= start && ts <= end
    })
    return {
      total: tasks.length,
      activeCount: open.length,
      doneCount: done.length,
      overdueCount: overdue.length,
      dueTodayCount: dueToday.length,
      completion: tasks.length ? Math.round((done.length / tasks.length) * 100) : 0
    }
  }, [tasks])

  const statusData = useMemo(
    () =>
      Object.values(STATUS).map((s) => ({
        name: s.label,
        value: tasks.filter((t) => t.status === s.key).length,
        color: s.hex
      })),
    [tasks]
  )

  const priorityData = useMemo(
    () =>
      Object.values(PRIORITY)
        .map((p) => ({
          name: p.label,
          value: tasks.filter((t) => t.priority === p.key && t.status !== 'done' && t.status !== 'cancelled').length,
          color: p.hex
        })),
    [tasks]
  )

  const projectData = useMemo(
    () =>
      state.projects
        .map((p) => ({
          name: p.name.length > 14 ? `${p.name.slice(0, 13)}…` : p.name,
          ativas: tasks.filter((t) => t.projectId === p.id && (t.status === 'todo' || t.status === 'in_progress')).length,
          concluídas: tasks.filter((t) => t.projectId === p.id && t.status === 'done').length
        }))
        .sort((a, b) => b.ativas - a.ativas),
    [state.projects, tasks]
  )

  const upcoming = useMemo(
    () =>
      tasks
        .filter((t) => t.dueDate && (t.status === 'todo' || t.status === 'in_progress'))
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5),
    [tasks]
  )

  const activityByDay = useMemo(() => {
    const now = new Date()
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const label = d.toLocaleDateString('pt-BR', { weekday: 'short' })
      const count = state.activities.filter((a) => a.createdAt.slice(0, 10) === key).length
      days.push({ name: label, value: count, color: count > 0 ? '#6366f1' : '#e2e8f0' })
    }
    return days
  }, [state.activities])

  const openTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status === 'todo' || t.status === 'in_progress')
        .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0))
        .slice(0, 4),
    [tasks]
  )

  const today = useMemo(() => {
    const start = startOfDay().getTime()
    const end = endOfDay().getTime()
    const dueTodayOpen = tasks.filter((t) => {
      if (!t.dueDate) return false
      const ts = new Date(t.dueDate).getTime()
      return ts >= start && ts <= end && (t.status === 'todo' || t.status === 'in_progress')
    })
    const overdueOpen = tasks.filter((t) => isOverdue(t.dueDate, t.status))
    const agenda = [
      ...overdueOpen,
      ...dueTodayOpen.filter((t) => !isOverdue(t.dueDate, t.status))
    ]
      .filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i)
      .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0))
    return {
      dueToday: dueTodayOpen.length,
      overdue: overdueOpen.length,
      agenda: agenda.slice(0, 6)
    }
  }, [tasks])

  const favoriteTasks = useMemo(() => tasks.filter((t) => t.favorite).slice(0, 4), [tasks])

  return {
    metrics,
    statusData,
    priorityData,
    projectData,
    upcoming,
    activityByDay,
    openTasks,
    today,
    favoriteTasks
  }
}
