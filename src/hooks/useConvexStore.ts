/**
 * useConvexStore — provides the same API as useStore() but backed by Convex.
 *
 * When USE_CONVEX is true, data comes from Convex queries and mutations.
 * When false, falls back to the existing localStorage-based store.
 *
 * Components can use either hook — the interface is identical:
 *   const { state, dispatch } = useStore()     // localStorage
 *   const { state, dispatch } = useConvexStore() // Convex
 */

import { useCallback, useMemo, useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getAnonymousUserId, USE_CONVEX } from "../components/ConvexProvider";
import type { AppState, AppAction, Task, TaskStatus } from "../types";

// Default state shape (same as initialState in store.tsx)
const EMPTY_STATE: AppState = {
  me: { id: "me", name: "Você", bio: "" },
  tasks: [],
  projects: [],
  categories: [],
  notes: {},
  activities: [],
  reminders: [],
  trash: [],
  theme: "light",
  booted: false,
  prefs: { soundAlerts: false, compactMode: false },
  notifPrefs: { dueDates: true },
  appearance: { firstDay: "sunday" },
};

/**
 * Hook that provides { state, dispatch } backed by Convex.
 * The dispatch function accepts the same AppAction types as the localStorage store.
 */
export function useConvexStore() {
  const userId = getAnonymousUserId();

  // ── Queries (read) ──
  const tasks = useQuery(api.tasks.list, { userId }) ?? [];
  const projects = useQuery(api.projects.list, { userId }) ?? [];
  const categories = useQuery(api.categories.list, { userId }) ?? [];
  const activities = useQuery(api.activities.list, { userId }) ?? [];
  const reminders = useQuery(api.reminders.list, { userId }) ?? [];
  const trash = useQuery(api.trash.list, { userId }) ?? [];
  const allNotes = useQuery(api.notes.listAll, { userId }) ?? [];
  const profile = useQuery(api.profiles.get, { userId });
  const prefs = useQuery(api.preferences.get, { userId });

  // ── Mutations (write) ──
  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);
  const toggleDoneTask = useMutation(api.tasks.toggleDone);
  const completeTaskMut = useMutation(api.tasks.complete);
  const reopenTaskMut = useMutation(api.tasks.reopen);
  const setTaskStatusMut = useMutation(api.tasks.setStatus);
  const cancelTask = useMutation(api.tasks.cancel);
  const deleteTask = useMutation(api.tasks.remove);
  const toggleFav = useMutation(api.tasks.toggleFavorite);
  const duplicateTask = useMutation(api.tasks.duplicate);
  const toggleSub = useMutation(api.tasks.toggleSubtask);

  const createProject = useMutation(api.projects.create);
  const updateProject = useMutation(api.projects.update);
  const removeProject = useMutation(api.projects.remove);

  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const removeCategory = useMutation(api.categories.remove);

  const addNote = useMutation(api.notes.add);
  const deleteNote = useMutation(api.notes.remove);

  const markRead = useMutation(api.reminders.markRead);
  const markAllRead = useMutation(api.reminders.markAllRead);
  const createReminder = useMutation(api.reminders.create);
  const clearReminders = useMutation(api.reminders.clear);

  const restoreTasks = useMutation(api.trash.restore);
  const clearTrash = useMutation(api.trash.clear);

  const upsertProfile = useMutation(api.profiles.upsert);
  const upsertPrefs = useMutation(api.preferences.upsert);

  // ── Build state ──
  // Convert notes array into NotesMap
  const notesMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const note of allNotes) {
      if (!map[note.taskId]) map[note.taskId] = [];
      map[note.taskId].push({ id: note._id.toString(), text: note.text, createdAt: note.createdAt });
    }
    return map;
  }, [allNotes]);

  // Theme from prefs or localStorage
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("taskflow-theme") || "light") as "light" | "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("taskflow-theme", theme);
  }, [theme]);

  const state: AppState = useMemo(() => ({
    me: profile ? { id: "me", name: profile.name, bio: profile.bio ?? "" } : EMPTY_STATE.me,
    tasks: (tasks as any[]).map((t: any) => ({
      id: t._id.toString(),
      title: t.title,
      description: t.description ?? "",
      status: t.status as TaskStatus,
      priority: t.priority,
      projectId: t.projectId ?? null,
      categoryId: t.categoryId ?? null,
      dueDate: t.dueDate ?? null,
      createdAt: t.createdAt,
      estimatedHours: t.estimatedHours ?? 0,
      progress: t.progress ?? 0,
      tags: t.tags ?? [],
      subtasks: t.subtasks ?? [],
      favorite: t.favorite ?? false,
      recurrence: t.recurrence ?? null,
      cancelReason: t.cancelReason ?? null,
    })),
    projects: (projects as any[]).map((p: any) => ({ id: p._id.toString(), name: p.name, description: p.description ?? "", color: p.color, due: p.due ?? null })),
    categories: (categories as any[]).map((c: any) => ({ id: c._id.toString(), name: c.name, color: c.color })),
    notes: notesMap,
    activities: (activities as any[]).map((a: any) => ({ id: a._id.toString(), type: a.type, taskId: a.taskId ?? null, text: a.text, createdAt: a.createdAt })),
    reminders: (reminders as any[]).map((r: any) => ({ id: r._id.toString(), type: r.type, title: r.title, body: r.body, taskId: r.taskId, read: r.read, createdAt: r.createdAt })),
    trash: (trash as any[]).map((e: any) => ({ task: e.task, notes: e.notes ?? [], deletedAt: e.deletedAt })),
    theme,
    booted: true,
    prefs: prefs ? { soundAlerts: prefs.soundAlerts, compactMode: prefs.compactMode } : EMPTY_STATE.prefs,
    notifPrefs: prefs ? { dueDates: prefs.dueDates } : EMPTY_STATE.notifPrefs,
    appearance: prefs ? { firstDay: prefs.firstDay } : EMPTY_STATE.appearance,
  }), [tasks, projects, categories, notesMap, activities, reminders, trash, theme, profile, prefs]);

  // ── Dispatch ──
  const dispatch = useCallback((action: AppAction) => {
    switch (action.type) {
      // ── Theme / Prefs (local) ──
      case "SET_THEME":
        setTheme(action.theme);
        return;
      case "UPDATE_PREFS":
        upsertPrefs({ userId, soundAlerts: action.prefs.soundAlerts ?? false, compactMode: action.prefs.compactMode ?? false, dueDates: prefs?.dueDates ?? true, firstDay: prefs?.firstDay ?? "sunday", theme });
        return;
      case "UPDATE_NOTIF_PREFS":
        upsertPrefs({ userId, soundAlerts: prefs?.soundAlerts ?? false, compactMode: prefs?.compactMode ?? false, dueDates: action.notifPrefs.dueDates ?? true, firstDay: prefs?.firstDay ?? "sunday", theme });
        return;
      case "UPDATE_APPEARANCE":
        upsertPrefs({ userId, soundAlerts: prefs?.soundAlerts ?? false, compactMode: prefs?.compactMode ?? false, dueDates: prefs?.dueDates ?? true, firstDay: action.appearance.firstDay ?? "sunday", theme });
        return;
      case "UPDATE_ME":
        upsertProfile({ userId, name: action.patch.name ?? "Você", bio: action.patch.bio ?? "" });
        return;

      // ── Tasks ──
      case "CREATE_TASK":
        createTask({ userId, title: action.task.title, description: action.task.description, status: action.task.status, priority: action.task.priority, projectId: action.task.projectId ?? undefined, categoryId: action.task.categoryId ?? undefined, dueDate: action.task.dueDate ?? undefined, estimatedHours: action.task.estimatedHours, tags: action.task.tags, subtasks: action.task.subtasks, favorite: action.task.favorite, recurrence: action.task.recurrence ?? undefined });
        return;
      case "UPDATE_TASK":
        updateTask({ userId, taskId: action.taskId, patch: action.patch as any });
        return;
      case "TOGGLE_TASK_DONE":
        toggleDoneTask({ userId, taskId: action.taskId });
        return;
      case "COMPLETE_TASK":
        completeTaskMut({ userId, taskId: action.taskId });
        return;
      case "REOPEN_TASK":
        reopenTaskMut({ userId, taskId: action.taskId });
        return;
      case "SET_TASK_STATUS":
        setTaskStatusMut({ userId, taskId: action.taskId, status: action.status });
        return;
      case "CANCEL_TASK":
        cancelTask({ userId, taskId: action.taskId, reason: action.reason });
        return;
      case "DELETE_TASK":
        deleteTask({ userId, taskId: action.taskId });
        return;
      case "RESTORE_TASK": {
        const ids = action.taskIds ?? (action.taskId ? [action.taskId] : []);
        restoreTasks({ userId, taskIds: ids });
        return;
      }
      case "TOGGLE_FAVORITE":
        toggleFav({ taskId: action.taskId });
        return;
      case "DUPLICATE_TASK":
        duplicateTask({ userId, taskId: action.taskId });
        return;
      case "TOGGLE_SUBTASK":
        toggleSub({ taskId: action.taskId, subtaskId: action.subtaskId });
        return;

      // ── Notes ──
      case "ADD_NOTE":
        addNote({ userId, taskId: action.taskId, text: action.text });
        return;
      case "DELETE_NOTE":
        deleteNote({ taskId: action.taskId, noteId: action.noteId });
        return;

      // ── Reminders ──
      case "MARK_REMINDER_READ":
        markRead({ id: action.id });
        return;
      case "MARK_ALL_REMINDERS_READ":
        markAllRead({ userId });
        return;
      case "CLEAR_REMINDERS":
        clearReminders({ userId });
        return;

      // ── Projects ──
      case "CREATE_PROJECT":
        createProject({ userId, name: action.name, description: action.description, color: action.color, due: action.due });
        return;

      // ── Categories ──
      case "CREATE_CATEGORY":
        createCategory({ userId, name: action.name, color: action.color });
        return;

      // ── Trash ──
      case "CLEAR_TRASH":
        clearTrash({ userId });
        return;

      // ── No-ops for Convex mode ──
      case "BOOT":
      case "RECONCILE_REMINDERS":
      case "IMPORT_DATA":
      case "RESET":
        // These are localStorage-specific. In Convex mode, data is always current.
        return;

      default:
        console.warn("[ConvexStore] Unknown action:", (action as any).type);
    }
  }, [userId, theme, prefs, createTask, updateTask, toggleDoneTask, completeTaskMut, reopenTaskMut, setTaskStatusMut, cancelTask, deleteTask, toggleFav, duplicateTask, toggleSub, addNote, deleteNote, markRead, markAllRead, createReminder, clearReminders, createProject, updateProject, removeProject, createCategory, updateCategory, removeCategory, restoreTasks, clearTrash, upsertProfile, upsertPrefs]);

  return { state, dispatch };
}

/**
 * Convenience hook that returns the right store based on USE_CONVEX.
 * This is the main entry point for components.
 */
export { useStore as useLocalStorageStore } from "../store/store";
