/**
 * Import/export domain logic — extracted from store.tsx.
 *
 * Normalizes and validates imported data.
 * Fills defaults, removes invalid fields, fixes broken references.
 */

import { uid } from './tasks'
import { trimActivities } from './tasks'
import type { AppState, Task, Project, Category, Activity, TaskStatus, TaskPriority, RecurrenceType } from '../types'

const VALID_STATUS = new Set(['todo', 'in_progress', 'done', 'cancelled'])
const VALID_PRIORITY = new Set(['low', 'medium', 'high', 'urgent'])
const VALID_RECURRENCE = new Set(['none', 'daily', 'weekly', 'monthly'])

/**
 * Normalize and validate imported data.
 * Fills defaults, removes invalid fields, fixes broken references.
 */
export function normalizeImportedData(d: Record<string, any>, currentState: AppState): Record<string, any> {
  const tasks = Array.isArray(d.tasks) ? d.tasks.map((t: Record<string, any>) => {
    if (!t || typeof t !== 'object') return null
    const id = t.id || uid('t')
    return {
      id,
      title: String(t.title || 'Sem título').trim(),
      description: String(t.description || ''),
      status: (VALID_STATUS.has(t.status) ? t.status : 'todo') as TaskStatus,
      priority: (VALID_PRIORITY.has(t.priority) ? t.priority : 'medium') as TaskPriority,
      projectId: t.projectId || null,
      categoryId: t.categoryId || null,
      dueDate: t.dueDate || null,
      createdAt: t.createdAt || new Date().toISOString(),
      estimatedHours: Number(t.estimatedHours) || 0,
      progress: Math.max(0, Math.min(100, Number(t.progress) || 0)),
    tags: Array.isArray(t.tags) ? t.tags.filter((tag: any) => typeof tag === 'string') : [],
    subtasks: Array.isArray(t.subtasks) ? t.subtasks.map((s: Record<string, any>) => ({
        id: s?.id || uid('s'),
        title: String(s?.title || ''),
        done: Boolean(s?.done)
      })) : [],
      favorite: Boolean(t.favorite),
      recurrence: VALID_RECURRENCE.has(t.recurrence) ? t.recurrence as RecurrenceType : null,
      cancelReason: t.cancelReason || null
    }
  }).filter(Boolean) : currentState.tasks

  const projects: Project[] = Array.isArray(d.projects) ? d.projects.map((p: Record<string, any>) => {
    if (!p || typeof p !== 'object') return null
    return {
      id: p.id || uid('p'),
      name: String(p.name || 'Sem nome').trim(),
      description: String(p.description || ''),
      color: typeof p.color === 'string' ? p.color : '#6366f1',
      due: p.due || null
    }
  }).filter(Boolean) as Project[] : currentState.projects

  const categories: Category[] = Array.isArray(d.categories) ? d.categories.map((c: Record<string, any>) => {
    if (!c || typeof c !== 'object') return null
    return {
      id: c.id || uid('c'),
      name: String(c.name || 'Sem nome').trim(),
      color: typeof c.color === 'string' ? c.color : '#94a3b8'
    }
  }).filter(Boolean) as Category[] : currentState.categories

  // Fix broken project/category references
  const projectIds = new Set(projects.map((p) => p.id))
  const categoryIds = new Set(categories.map((c) => c.id))
  const cleanedTasks = (tasks as Task[]).map((t) => ({
    ...t,
    projectId: t.projectId && projectIds.has(t.projectId) ? t.projectId : null,
    categoryId: t.categoryId && categoryIds.has(t.categoryId) ? t.categoryId : null
  }))

  // Normalize notes
  const notes = d.notes && typeof d.notes === 'object' && !Array.isArray(d.notes) && Object.keys(d.notes).length > 0
    ? d.notes
    : currentState.notes

  // Normalize activities
  const activities = Array.isArray(d.activities)
    ? d.activities.filter((a: Record<string, any>) => a && typeof a === 'object' && a.id)
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
