/**
 * Schema migration system for localStorage persistence.
 *
 * Each migration transforms the state from one version to the next.
 * Migrations run sequentially from the saved version to the current version.
 *
 * To add a new migration:
 * 1. Increment PERSIST_VERSION in store.tsx
 * 2. Add a migration function here
 * 3. Register it in the migrations map
 */

export const PERSIST_VERSION = 3

interface MigrationContext {
  /** Current date key for normalization */
  todayKey: string
}

type Migration = (state: Record<string, any>, ctx: MigrationContext) => Record<string, any>

/**
 * Migration v1 → v2: Initial structured state
 * (This was already applied before the migration system existed)
 */
const migrateV1ToV2: Migration = (state) => state

/**
 * Migration v2 → v3: Normalize dates to YYYY-MM-DD keys
 * - Ensures all dueDate fields are YYYY-MM-DD strings
 * - Ensures createdAt fields are ISO strings
 * - Adds missing fields with defaults
 */
const migrateV2ToV3: Migration = (state, ctx) => {
  // Normalize tasks
  if (Array.isArray(state.tasks)) {
    state.tasks = state.tasks.map((t: any) => ({
      id: t.id || `t-${Date.now()}`,
      title: String(t.title || 'Sem título').trim(),
      description: String(t.description || ''),
      status: ['todo', 'in_progress', 'done', 'cancelled'].includes(t.status) ? t.status : 'todo',
      priority: ['low', 'medium', 'high', 'urgent'].includes(t.priority) ? t.priority : 'medium',
      projectId: t.projectId || null,
      // categoryId removed — unified into tags
      dueDate: normalizeDateKey(t.dueDate),
      createdAt: t.createdAt || new Date().toISOString(),
      estimatedHours: Number(t.estimatedHours) || 0,
      progress: Math.max(0, Math.min(100, Number(t.progress) || 0)),
      tags: Array.isArray(t.tags) ? t.tags.filter((tag: any) => typeof tag === 'string') : [],
      subtasks: Array.isArray(t.subtasks) ? t.subtasks.map((s: any) => ({
        id: s?.id || `s-${Date.now()}`,
        title: String(s?.title || ''),
        done: Boolean(s?.done),
      })) : [],
      favorite: Boolean(t.favorite),
      recurrence: ['none', 'daily', 'weekly', 'monthly'].includes(t.recurrence) ? t.recurrence : null,
      cancelReason: t.cancelReason || null,
    }))
  }

  // Normalize projects
  if (Array.isArray(state.projects)) {
    state.projects = state.projects.map((p: any) => ({
      id: p.id || `p-${Date.now()}`,
      name: String(p.name || 'Sem nome').trim(),
      description: String(p.description || ''),
      color: typeof p.color === 'string' ? p.color : '#6366f1',
      due: normalizeDateKey(p.due),
    }))
  }

  // Categories removed — old data ignored during migration

  // Ensure notes is an object with arrays
  if (!state.notes || typeof state.notes !== 'object' || Array.isArray(state.notes)) {
    state.notes = {}
  }

  // Ensure arrays exist
  state.activities = Array.isArray(state.activities) ? state.activities : []
  state.reminders = Array.isArray(state.reminders) ? state.reminders : []
  state.trash = Array.isArray(state.trash) ? state.trash : []

  // Ensure user profile exists
  if (!state.me || typeof state.me !== 'object') {
    state.me = { id: 'me', name: 'Você', bio: '' }
  }

  // Ensure preferences exist
  state.prefs = state.prefs || { soundAlerts: false, compactMode: false }
  state.notifPrefs = state.notifPrefs || { dueDates: true }
  state.appearance = state.appearance || { firstDay: 'sunday' }

  return state
}

/** Normalize a date value to YYYY-MM-DD key or null */
function normalizeDateKey(value: any): string | null {
  if (!value) return null
  const s = String(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  try {
    const dt = new Date(s)
    if (isNaN(dt.getTime())) return null
    const y = dt.getFullYear()
    const m = String(dt.getMonth() + 1).padStart(2, '0')
    const d = String(dt.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  } catch {
    return null
  }
}

/** Map of version → migration function */
const migrations: Record<number, Migration> = {
  2: migrateV1ToV2,
  3: migrateV2ToV3,
}

/**
 * Run all migrations from the saved version to the current version.
 * Returns the migrated state.
 */
export function migrateState(
  saved: Record<string, any>,
  savedVersion: number
): Record<string, any> {
  const ctx: MigrationContext = {
    todayKey: (() => {
      const now = new Date()
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      const d = String(now.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    })(),
  }

  let state = { ...saved }
  for (let v = savedVersion + 1; v <= PERSIST_VERSION; v++) {
    const migration = migrations[v]
    if (migration) {
      state = migration(state, ctx)
    }
  }

  return state
}
