import type { AppState } from '../types'

export const ME: { id: string; name: string; bio: string }
export const PROJECTS: any[]
export const CATEGORIES: any[]
export const TASKS: any[]
export const NOTES: Record<string, any[]>
export const ACTIVITIES: any[]
export const REMINDERS: any[]
export const MOCK_STATE: Partial<AppState>
