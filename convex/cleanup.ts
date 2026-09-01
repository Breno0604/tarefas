/**
 * Scheduled cleanup functions for Convex.
 *
 * - Trash: removes entries older than 30 days
 * - Activities: keeps only the 500 most recent per user
 * - Pairing codes: removes expired codes
 *
 * Run via Convex crons or call manually.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Today's date key YYYY-MM-DD. */
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Local date key from YYYY-MM-DD string. */
function localDateKey(iso: string): string {
  if (!iso) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Remove trash entries older than 30 days for a user. */
export const cleanTrash = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const entries = await ctx.db
      .query("trash")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    let deleted = 0;
    for (const entry of entries) {
      if (entry.deletedAt < cutoff) {
        await ctx.db.delete(entry._id);
        deleted++;
      }
    }
    return { deleted };
  },
});

/** Keep only the 500 most recent activities for a user. */
export const cleanActivities = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const MAX = 500;
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    let deleted = 0;
    if (activities.length > MAX) {
      const toDelete = activities.slice(MAX);
      for (const a of toDelete) {
        await ctx.db.delete(a._id);
        deleted++;
      }
    }
    return { deleted, total: activities.length };
  },
});

/** Remove expired pairing codes. */
export const cleanPairingCodes = mutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    const all = await ctx.db.query("pairing_codes").collect();
    let deleted = 0;
    for (const entry of all) {
      if (entry.expiresAt < now) {
        await ctx.db.delete(entry._id);
        deleted++;
      }
    }
    return { deleted };
  },
});

/** Run all cleanups for a user. */
export const cleanAll = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Trash cleanup
    const trashCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const trashEntries = await ctx.db
      .query("trash")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    let trashDeleted = 0;
    for (const entry of trashEntries) {
      if (entry.deletedAt < trashCutoff) {
        await ctx.db.delete(entry._id);
        trashDeleted++;
      }
    }

    // Activities cleanup (keep 500 most recent)
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    let activitiesDeleted = 0;
    if (activities.length > 500) {
      for (const a of activities.slice(500)) {
        await ctx.db.delete(a._id);
        activitiesDeleted++;
      }
    }

    // Pairing codes cleanup (expired)
    const now = new Date().toISOString();
    const codes = await ctx.db.query("pairing_codes").collect();
    let codesDeleted = 0;
    for (const c of codes) {
      if (c.expiresAt < now) {
        await ctx.db.delete(c._id);
        codesDeleted++;
      }
    }

    // Reconcile reminders
    const today = todayKey();
    const DAY = 24 * 60 * 60 * 1000;
    const allTasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const allReminders = await ctx.db
      .query("reminders")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const taskMap = new Map(allTasks.map((t) => [t._id.toString(), t]));
    let remindersDeleted = 0;
    for (const r of allReminders) {
      const task = taskMap.get(r.taskId);
      if (!task || task.status === "done" || task.status === "cancelled" || !task.dueDate) {
        await ctx.db.delete(r._id); remindersDeleted++; continue;
      }
      const taskDateKey = localDateKey(task.dueDate);
      if (r.title === "Tarefa atrasada" && !(taskDateKey < today)) {
        await ctx.db.delete(r._id); remindersDeleted++; continue;
      }
      if (r.title === "Vencimento próximo") {
        if (taskDateKey < today) { await ctx.db.delete(r._id); remindersDeleted++; continue; }
        const diff = Math.round((new Date(taskDateKey).getTime() - new Date(today).getTime()) / DAY);
        if (diff > 3 || diff < 0) { await ctx.db.delete(r._id); remindersDeleted++; continue; }
      }
    }
    const recheck = await ctx.db
      .query("reminders")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const hasRem = (taskId: string) => recheck.some((r) => r.taskId === taskId);
    let remindersCreated = 0;
    for (const task of allTasks) {
      if (!task.dueDate || task.status === "done" || task.status === "cancelled") continue;
      const dk = localDateKey(task.dueDate);
      if (dk < today && !hasRem(task._id.toString())) {
        await ctx.db.insert("reminders", { userId: args.userId, type: "due", title: "Tarefa atrasada", body: `\"${task.title}\" está atrasada.`, taskId: task._id.toString(), read: false, createdAt: new Date().toISOString() });
        remindersCreated++;
      } else if (dk > today) {
        const diff = Math.round((new Date(dk).getTime() - new Date(today).getTime()) / DAY);
        if (diff <= 3 && !hasRem(task._id.toString())) {
          const body = diff === 1 ? `\"${task.title}\" vence amanhã.` : `\"${task.title}\" vence em ${diff} dia(s).`;
          await ctx.db.insert("reminders", { userId: args.userId, type: "due", title: "Vencimento próximo", body, taskId: task._id.toString(), read: false, createdAt: new Date().toISOString() });
          remindersCreated++;
        }
      }
    }

    return { trashDeleted, activitiesDeleted, codesDeleted, remindersCreated, remindersDeleted };
  },
});

/**
 * Reconcile reminders: create missing ones and remove stale ones.
 * Mirrors the localStorage reconcileReminders logic.
 */
export const reconcileReminders = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const today = todayKey();
    const DAY = 24 * 60 * 60 * 1000;

    // Fetch all tasks and existing reminders for this user
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const existingReminders = await ctx.db
      .query("reminders")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const taskMap = new Map(tasks.map((t) => [t._id.toString(), t]));
    let created = 0;
    let deleted = 0;

    // Remove stale or orphaned reminders
    for (const r of existingReminders) {
      const task = taskMap.get(r.taskId);
      // Remove if task missing, done, cancelled, or no due date
      if (!task || task.status === "done" || task.status === "cancelled" || !task.dueDate) {
        await ctx.db.delete(r._id);
        deleted++;
        continue;
      }
      const taskDateKey = localDateKey(task.dueDate);
      // Remove overdue reminder if task is no longer overdue
      if (r.title === "Tarefa atrasada" && !(taskDateKey < today)) {
        await ctx.db.delete(r._id);
        deleted++;
        continue;
      }
      // Remove upcoming reminder if outside 3-day window
      if (r.title === "Vencimento próximo") {
        if (taskDateKey < today) {
          await ctx.db.delete(r._id);
          deleted++;
          continue;
        }
        const diffDays = Math.round((new Date(taskDateKey).getTime() - new Date(today).getTime()) / DAY);
        if (diffDays > 3 || diffDays < 0) {
          await ctx.db.delete(r._id);
          deleted++;
          continue;
        }
      }
    }

    // Re-fetch after deletions
    const remainingReminders = await ctx.db
      .query("reminders")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const hasReminder = (type: string, taskId: string) =>
      remainingReminders.some((r) => r.type === type && r.taskId === taskId);

    // Create missing reminders
    for (const task of tasks) {
      if (!task.dueDate || task.status === "done" || task.status === "cancelled") continue;
      const taskDateKey = localDateKey(task.dueDate);

      if (taskDateKey < today) {
        // Overdue
        if (!hasReminder("due", task._id.toString())) {
          await ctx.db.insert("reminders", {
            userId: args.userId,
            type: "due",
            title: "Tarefa atrasada",
            body: `"${task.title}" está atrasada.`,
            taskId: task._id.toString(),
            read: false,
            createdAt: new Date().toISOString(),
          });
          created++;
        }
      } else if (taskDateKey > today) {
        // Due in the future — check if within 3-day window
        const diffDays = Math.round((new Date(taskDateKey).getTime() - new Date(today).getTime()) / DAY);
        if (diffDays <= 3 && !hasReminder("due", task._id.toString())) {
          const body = diffDays === 1
            ? `"${task.title}" vence amanhã.`
            : `"${task.title}" vence em ${diffDays} dia(s).`;
          await ctx.db.insert("reminders", {
            userId: args.userId,
            type: "due",
            title: "Vencimento próximo",
            body,
            taskId: task._id.toString(),
            read: false,
            createdAt: new Date().toISOString(),
          });
          created++;
        }
      }
    }

    return { created, deleted };
  },
});

/** Query: count records per table for a user (for dashboard). */
export const counts = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const tasks = await ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    const projects = await ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    const categories = await ctx.db.query("categories").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    const notes = await ctx.db.query("notes").withIndex("by_user_task", (q) => q.eq("userId", args.userId)).collect();
    const activities = await ctx.db.query("activities").withIndex("by_user_created", (q) => q.eq("userId", args.userId)).collect();
    const trash = await ctx.db.query("trash").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    return {
      tasks: tasks.length,
      projects: projects.length,
      categories: categories.length,
      notes: notes.length,
      activities: activities.length,
      trash: trash.length,
    };
  },
});
