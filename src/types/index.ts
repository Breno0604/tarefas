// TaskFlow Pessoal — Domain Type Definitions

export type TaskStatus = "todo" | "in_progress" | "done" | "cancelled"
export type TaskPriority = "low" | "medium" | "high" | "urgent"
export type RecurrenceType = "none" | "daily" | "weekly" | "monthly"

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  projectId: string | null
  categoryId: string | null
  dueDate: string | null
  createdAt: string
  estimatedHours: number
  progress: number
  tags: string[]
  subtasks: Subtask[]
  favorite: boolean
  recurrence: RecurrenceType | null
  cancelReason: string | null
  archived?: boolean
}

export interface Project {
  id: string
  name: string
  description: string
  color: string
  due: string | null
}

export interface Category {
  id: string
  name: string
  color: string
}

export interface Note {
  id: string
  text: string
  createdAt: string
}

export type NotesMap = Record<string, Note[]>

export type ActivityType =
  | "create" | "status" | "priority" | "due"
  | "project" | "title" | "note" | "delete"
  | "restore" | "cancel" | "category"

export interface Activity {
  id: string
  type: ActivityType
  taskId: string | null
  text: string
  createdAt: string
}

export interface Reminder {
  id: string
  type: "due"
  title: string
  body: string
  taskId: string
  read: boolean
  createdAt: string
}

export interface TrashEntry {
  task: Task
  notes: Note[]
  deletedAt: string
}

export interface UserProfile {
  id: string
  name: string
  bio: string
}

export interface Preferences {
  soundAlerts: boolean
  compactMode: boolean
}

export interface NotificationPreferences {
  dueDates: boolean
}

export interface Appearance {
  firstDay: "sunday" | "monday"
}

export interface AppState {
  me: UserProfile
  tasks: Task[]
  projects: Project[]
  categories: Category[]
  notes: NotesMap
  activities: Activity[]
  reminders: Reminder[]
  trash: TrashEntry[]
  theme: "light" | "dark"
  booted: boolean
  prefs: Preferences
  notifPrefs: NotificationPreferences
  appearance: Appearance
  _lastDuplicatedId?: string
}

export type AppAction =
  | { type: "BOOT" }
  | { type: "RECONCILE_REMINDERS" }
  | { type: "SET_THEME"; theme: "light" | "dark" }
  | { type: "UPDATE_PREFS"; prefs: Partial<Preferences> }
  | { type: "UPDATE_NOTIF_PREFS"; notifPrefs: Partial<NotificationPreferences> }
  | { type: "UPDATE_APPEARANCE"; appearance: Partial<Appearance> }
  | { type: "UPDATE_ME"; patch: Partial<UserProfile> }
  | { type: "CREATE_TASK"; task: CreateTaskPayload }
  | { type: "UPDATE_TASK"; taskId: string; patch: Partial<Task> }
  | { type: "TOGGLE_TASK_DONE"; taskId: string }
  | { type: "COMPLETE_TASK"; taskId: string }
  | { type: "REOPEN_TASK"; taskId: string }
  | { type: "SET_TASK_STATUS"; taskId: string; status: TaskStatus }
  | { type: "CANCEL_TASK"; taskId: string; reason?: string }
  | { type: "DELETE_TASK"; taskId: string }
  | { type: "RESTORE_TASK"; taskId: string; taskIds?: string[] }
  | { type: "TOGGLE_FAVORITE"; taskId: string }
  | { type: "DUPLICATE_TASK"; taskId: string }
  | { type: "TOGGLE_SUBTASK"; taskId: string; subtaskId: string }
  | { type: "ADD_NOTE"; taskId: string; text: string }
  | { type: "DELETE_NOTE"; taskId: string; noteId: string }
  | { type: "MARK_REMINDER_READ"; id: string }
  | { type: "MARK_ALL_REMINDERS_READ" }
  | { type: "CLEAR_REMINDERS" }
  | { type: "CREATE_PROJECT"; name: string; description?: string; color?: string; due?: string }
  | { type: "CREATE_CATEGORY"; name: string; color?: string }
  | { type: "IMPORT_DATA"; data: Partial<AppState> }
  | { type: "DELETE_ACTIVITY"; activityId: string }
  | { type: "EDIT_CATEGORY"; categoryId: string; name: string; color: string }
  | { type: "DELETE_CATEGORY"; categoryId: string }
  | { type: "EDIT_PROJECT"; projectId: string; name: string; description: string; color: string; due?: string | null }
  | { type: "DELETE_PROJECT"; projectId: string }
  | { type: "TOGGLE_ARCHIVE"; taskId: string }
  | { type: "CLEAR_TRASH" }
  | { type: "RESET" }

export interface CreateTaskPayload {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  projectId?: string | null
  categoryId?: string | null
  dueDate?: string | null
  estimatedHours?: number
  tags?: string[]
  subtasks?: Subtask[]
  favorite?: boolean
  recurrence?: RecurrenceType | null
}

export interface CompleteTaskResult {
  tasks: Task[]
  activities: Activity[]
  spawned: Task | null
}

export interface ReopenTaskResult {
  tasks: Task[]
  activities: Activity[]
}

export interface StoreContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

export type ToastVariant = "success" | "error" | "info" | "warning"

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
  action?: ToastAction
  duration?: number
}
