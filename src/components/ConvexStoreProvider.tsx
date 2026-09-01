/**
 * ConvexStoreProvider — provides the same StoreContext as StoreProvider
 * but backed by Convex queries/mutations.
 *
 * Every useStore() call throughout the app automatically reads from
 * Convex when this provider is used.
 */

import React, { useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getAnonymousUserId } from "./ConvexProvider";
import { StoreContext } from "../store/store";
import type {
  AppState, AppAction, TaskStatus, TaskPriority, RecurrenceType,
  StoreContextValue, Appearance,
} from "../types";

/** Default empty state */
const EMPTY: AppState = {
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

export function ConvexStoreProvider({ children }: { children: React.ReactNode }) {
  const userId = getAnonymousUserId();

  // ── Queries ──
  const tasksRaw = useQuery(api.tasks.list, { userId }) ?? [];
  const projectsRaw = useQuery(api.projects.list, { userId }) ?? [];
  const categoriesRaw = useQuery(api.categories.list, { userId }) ?? [];
  const activitiesRaw = useQuery(api.activities.list, { userId }) ?? [];
  const remindersRaw = useQuery(api.reminders.list, { userId }) ?? [];
  const trashRaw = useQuery(api.trash.list, { userId }) ?? [];
  const allNotesRaw = useQuery(api.notes.listAll, { userId }) ?? [];
  const profileRaw = useQuery(api.profiles.get, { userId });
  const prefsRaw = useQuery(api.preferences.get, { userId });

  // ── Mutations ──
  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);
  const toggleDoneMut = useMutation(api.tasks.toggleDone);
  const completeTaskMut = useMutation(api.tasks.complete);
  const reopenTaskMut = useMutation(api.tasks.reopen);
  const setStatusMut = useMutation(api.tasks.setStatus);
  const cancelTaskMut = useMutation(api.tasks.cancel);
  const deleteTaskMut = useMutation(api.tasks.remove);
  const toggleFavMut = useMutation(api.tasks.toggleFavorite);
  const duplicateTaskMut = useMutation(api.tasks.duplicate);
  const toggleSubMut = useMutation(api.tasks.toggleSubtask);

  const createProjectMut = useMutation(api.projects.create);
  const updateProjectMut = useMutation(api.projects.update);
  const removeProjectMut = useMutation(api.projects.remove);
  const createCategoryMut = useMutation(api.categories.create);
  const updateCategoryMut = useMutation(api.categories.update);
  const removeCategoryMut = useMutation(api.categories.remove);
  const addNoteMut = useMutation(api.notes.add);
  const deleteNoteMut = useMutation(api.notes.remove);

  const markReadMut = useMutation(api.reminders.markRead);
  const markAllReadMut = useMutation(api.reminders.markAllRead);
  const clearRemindersMut = useMutation(api.reminders.clear);

  const restoreTasksMut = useMutation(api.trash.restore);
  const clearTrashMut = useMutation(api.trash.clear);
  const deleteActivityMut = useMutation(api.activities.remove);

  const upsertProfileMut = useMutation(api.profiles.upsert);
  const upsertPrefsMut = useMutation(api.preferences.upsert);
  const cleanAllMut = useMutation(api.cleanup.cleanAll);

  // ── Cleanup: run once on boot ──
  useEffect(() => {
    cleanAllMut({ userId }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Theme (kept in localStorage for immediate effect) ──
  const [theme, setTheme] = React.useState<"light" | "dark">(() =>
    (localStorage.getItem("taskflow-theme") || "light") as "light" | "dark"
  );

  // ── Track last duplicated task ID for undo toast ──
  const [lastDuplicatedId, setLastDuplicatedId] = React.useState<string | undefined>(undefined);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("taskflow-theme", theme);
  }, [theme]);

  // ── Build state ──
  const state: AppState = useMemo(() => {
    // Build notes map from flat array
    const notesMap: Record<string, any[]> = {};
    for (const n of allNotesRaw) {
      const tid = (n as any).taskId;
      if (!notesMap[tid]) notesMap[tid] = [];
      notesMap[tid].push({ id: (n as any)._id.toString(), text: (n as any).text, createdAt: (n as any).createdAt });
    }

    return {
      me: profileRaw
        ? { id: "me", name: (profileRaw as any).name, bio: (profileRaw as any).bio ?? "" }
        : EMPTY.me,
      tasks: (tasksRaw as any[]).map((t: any) => ({
        id: t._id.toString(), title: t.title, description: t.description ?? "",
        status: t.status as TaskStatus, priority: t.priority as TaskPriority,
        projectId: t.projectId ?? null, categoryId: t.categoryId ?? null,
        dueDate: t.dueDate ?? null, createdAt: t.createdAt,
        estimatedHours: t.estimatedHours ?? 0, progress: t.progress ?? 0,
        tags: t.tags ?? [], subtasks: t.subtasks ?? [],
        favorite: t.favorite ?? false, recurrence: (t.recurrence ?? null) as RecurrenceType | null,
        cancelReason: t.cancelReason ?? null,
      })),
      projects: (projectsRaw as any[]).map((p: any) => ({
        id: p._id.toString(), name: p.name, description: p.description ?? "",
        color: p.color, due: p.due ?? null,
      })),
      categories: (categoriesRaw as any[]).map((c: any) => ({
        id: c._id.toString(), name: c.name, color: c.color,
      })),
      notes: notesMap,
      activities: (activitiesRaw as any[]).map((a: any) => ({
        id: a._id.toString(), type: a.type, taskId: a.taskId ?? null,
        text: a.text, createdAt: a.createdAt,
      })),
      reminders: (remindersRaw as any[]).map((r: any) => ({
        id: r._id.toString(), type: r.type, title: r.title, body: r.body,
        taskId: r.taskId, read: r.read, createdAt: r.createdAt,
      })),
      trash: (trashRaw as any[]).map((e: any) => ({
        task: e.task, notes: e.notes ?? [], deletedAt: e.deletedAt,
      })),
      theme,
      booted: true,
      prefs: prefsRaw
        ? { soundAlerts: (prefsRaw as any).soundAlerts, compactMode: (prefsRaw as any).compactMode }
        : EMPTY.prefs,
      notifPrefs: prefsRaw
        ? { dueDates: (prefsRaw as any).dueDates }
        : EMPTY.notifPrefs,
      appearance: prefsRaw
        ? { firstDay: (prefsRaw as any).firstDay as Appearance["firstDay"] }
        : EMPTY.appearance,
      _lastDuplicatedId: lastDuplicatedId,
    };
  }, [tasksRaw, projectsRaw, categoriesRaw, activitiesRaw, remindersRaw, trashRaw, allNotesRaw, profileRaw, prefsRaw, theme, lastDuplicatedId]);

  // ── Dispatch ──
  const dispatch = useCallback((action: AppAction) => {
    switch (action.type) {
      // ── Theme / Prefs ──
      case "SET_THEME": setTheme(action.theme); return;
      case "UPDATE_PREFS":
        upsertPrefsMut({ userId, soundAlerts: action.prefs.soundAlerts ?? (prefsRaw as any)?.soundAlerts ?? false, compactMode: action.prefs.compactMode ?? (prefsRaw as any)?.compactMode ?? false, dueDates: (prefsRaw as any)?.dueDates ?? true, firstDay: (prefsRaw as any)?.firstDay ?? "sunday", theme });
        return;
      case "UPDATE_NOTIF_PREFS":
        upsertPrefsMut({ userId, soundAlerts: (prefsRaw as any)?.soundAlerts ?? false, compactMode: (prefsRaw as any)?.compactMode ?? false, dueDates: action.notifPrefs.dueDates ?? true, firstDay: (prefsRaw as any)?.firstDay ?? "sunday", theme });
        return;
      case "UPDATE_APPEARANCE":
        upsertPrefsMut({ userId, soundAlerts: (prefsRaw as any)?.soundAlerts ?? false, compactMode: (prefsRaw as any)?.compactMode ?? false, dueDates: (prefsRaw as any)?.dueDates ?? true, firstDay: action.appearance.firstDay ?? "sunday", theme });
        return;
      case "UPDATE_ME":
        upsertProfileMut({ userId, name: action.patch.name ?? "Você", bio: action.patch.bio ?? "" });
        return;

      // ── Tasks ──
      case "CREATE_TASK":
        createTask({ userId, title: action.task.title, description: action.task.description, status: action.task.status, priority: action.task.priority, projectId: action.task.projectId ?? undefined, categoryId: action.task.categoryId ?? undefined, dueDate: action.task.dueDate ?? undefined, estimatedHours: action.task.estimatedHours, tags: action.task.tags, subtasks: action.task.subtasks, favorite: action.task.favorite, recurrence: action.task.recurrence ?? undefined });
        return;
      case "UPDATE_TASK":
        updateTask({ userId, taskId: action.taskId, patch: action.patch as any });
        return;
      case "TOGGLE_TASK_DONE":
        toggleDoneMut({ userId, taskId: action.taskId }); return;
      case "COMPLETE_TASK":
        completeTaskMut({ userId, taskId: action.taskId }); return;
      case "REOPEN_TASK":
        reopenTaskMut({ userId, taskId: action.taskId }); return;
      case "SET_TASK_STATUS":
        setStatusMut({ userId, taskId: action.taskId, status: action.status }); return;
      case "CANCEL_TASK":
        cancelTaskMut({ userId, taskId: action.taskId, reason: action.reason }); return;
      case "DELETE_TASK":
        deleteTaskMut({ userId, taskId: action.taskId }); return;
      case "RESTORE_TASK": {
        const ids = action.taskIds ?? (action.taskId ? [action.taskId] : []);
        restoreTasksMut({ userId, taskIds: ids }); return;
      }
      case "TOGGLE_FAVORITE":
        toggleFavMut({ userId, taskId: action.taskId }); return;
      case "DUPLICATE_TASK":
        duplicateTaskMut({ userId, taskId: action.taskId }).then((newId: any) => {
          if (newId) setLastDuplicatedId(newId.toString());
        }); return;
      case "TOGGLE_SUBTASK":
        toggleSubMut({ userId, taskId: action.taskId, subtaskId: action.subtaskId }); return;

      // ── Notes ──
      case "ADD_NOTE":
        addNoteMut({ userId, taskId: action.taskId, text: action.text }); return;
      case "DELETE_NOTE":
        deleteNoteMut({ userId, taskId: action.taskId, noteId: action.noteId }); return;

      // ── Reminders ──
      case "MARK_REMINDER_READ":
        markReadMut({ userId, id: action.id }); return;
      case "MARK_ALL_REMINDERS_READ":
        markAllReadMut({ userId }); return;
      case "CLEAR_REMINDERS":
        clearRemindersMut({ userId }); return;

      // ── Projects ──
      case "CREATE_PROJECT":
        createProjectMut({ userId, name: action.name, description: action.description, color: action.color, due: action.due }); return;
      case "EDIT_PROJECT":
        updateProjectMut({ userId, projectId: action.projectId, patch: { name: action.name, description: action.description, color: action.color, due: action.due ?? undefined } }); return;
      case "DELETE_PROJECT":
        removeProjectMut({ userId, projectId: action.projectId }); return;

      // ── Categories ──
      case "CREATE_CATEGORY":
        createCategoryMut({ userId, name: action.name, color: action.color }); return;
      case "EDIT_CATEGORY":
        updateCategoryMut({ userId, categoryId: action.categoryId, patch: { name: action.name, color: action.color } }); return;
      case "DELETE_CATEGORY":
        removeCategoryMut({ userId, categoryId: action.categoryId }); return;

      // ── Activities ──
      case "DELETE_ACTIVITY":
        deleteActivityMut({ userId, activityId: action.activityId as any }); return;

      // ── Trash ──
      case "CLEAR_TRASH":
        clearTrashMut({ userId }); return;

      // ── No-ops (Convex is always current) ──
      case "BOOT":
      case "RECONCILE_REMINDERS":
      case "IMPORT_DATA":
      case "RESET":
        return;

      default:
        console.warn("[ConvexStore] Unknown action:", (action as any).type);
    }
  }, [userId, theme, prefsRaw, deleteActivityMut, updateCategoryMut, removeCategoryMut, updateProjectMut, removeProjectMut, createTask, updateTask, toggleDoneMut, completeTaskMut, reopenTaskMut, setStatusMut, cancelTaskMut, deleteTaskMut, toggleFavMut, duplicateTaskMut, toggleSubMut, addNoteMut, deleteNoteMut, markReadMut, markAllReadMut, clearRemindersMut, createProjectMut, createCategoryMut, restoreTasksMut, clearTrashMut, upsertProfileMut, upsertPrefsMut]);

  const value = useMemo<StoreContextValue>(() => ({ state, dispatch }), [state, dispatch]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
