/**
 * Import/export mutations for Convex.
 *
 * - importAll: clears existing data for a user and inserts imported data
 * - exportAll: returns all data for a user (query)
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Import all data: clears existing tasks, projects, notes, activities,
 * and inserts the imported records. Preserves the userId.
 */
export const importAll = mutation({
  args: {
    userId: v.string(),
    tasks: v.array(
      v.object({
        title: v.string(),
        description: v.optional(v.string()),
        status: v.union(
          v.literal("todo"), v.literal("in_progress"),
          v.literal("done"), v.literal("cancelled")
        ),
        priority: v.union(
          v.literal("low"), v.literal("medium"),
          v.literal("high"), v.literal("urgent")
        ),
        projectId: v.optional(v.string()),
        dueDate: v.optional(v.string()),
        createdAt: v.string(),
        progress: v.number(),
        tags: v.array(v.string()),
        subtasks: v.array(v.object({ id: v.string(), title: v.string(), done: v.boolean() })),
        favorite: v.boolean(),
        recurrence: v.optional(
          v.union(v.literal("none"), v.literal("daily"), v.literal("weekly"), v.literal("monthly"))
        ),
        cancelReason: v.optional(v.string()),
      })
    ),
    projects: v.array(
      v.object({
        name: v.string(),
        description: v.optional(v.string()),
        color: v.string(),
        due: v.optional(v.string()),
      })
    ),
    notes: v.array(
      v.object({
        taskId: v.string(),
        text: v.string(),
        createdAt: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = args.userId;

    // Clear existing data
    const existingTasks = await ctx.db
      .query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    for (const t of existingTasks) await ctx.db.delete(t._id);

    const existingProjects = await ctx.db
      .query("projects").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    for (const p of existingProjects) await ctx.db.delete(p._id);

    const existingNotes = await ctx.db
      .query("notes").withIndex("by_user_task", (q) => q.eq("userId", userId)).collect();
    for (const n of existingNotes) await ctx.db.delete(n._id);

    const existingActivities = await ctx.db
      .query("activities").withIndex("by_user_created", (q) => q.eq("userId", userId)).collect();
    for (const a of existingActivities) await ctx.db.delete(a._id);

    // Insert imported data
    for (const task of args.tasks) {
      await ctx.db.insert("tasks", { userId, ...task });
    }
    for (const project of args.projects) {
      await ctx.db.insert("projects", { userId, ...project });
    }
    for (const note of args.notes) {
      await ctx.db.insert("notes", { userId, ...note });
    }

    return { imported: { tasks: args.tasks.length, projects: args.projects.length, notes: args.notes.length } };
  },
});

/**
 * Reset all data for a user (delete everything).
 */
export const resetAll = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const userId = args.userId;

    const tasks = await ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    for (const t of tasks) await ctx.db.delete(t._id);

    const projects = await ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    for (const p of projects) await ctx.db.delete(p._id);

    const notes = await ctx.db.query("notes").withIndex("by_user_task", (q) => q.eq("userId", userId)).collect();
    for (const n of notes) await ctx.db.delete(n._id);

    const activities = await ctx.db.query("activities").withIndex("by_user_created", (q) => q.eq("userId", userId)).collect();
    for (const a of activities) await ctx.db.delete(a._id);

    const reminders = await ctx.db.query("reminders").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    for (const r of reminders) await ctx.db.delete(r._id);

    const trashEntries = await ctx.db.query("trash").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    for (const e of trashEntries) await ctx.db.delete(e._id);

    return { deleted: tasks.length + projects.length + notes.length + activities.length + reminders.length + trashEntries.length };
  },
});

/**
 * Export all data for a user (read-only query).
 */
export const exportAll = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const userId = args.userId;

    const tasks = await ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const projects = await ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const allNotes = await ctx.db.query("notes").withIndex("by_user_task", (q) => q.eq("userId", userId)).collect();
    const activities = await ctx.db.query("activities").withIndex("by_user_created", (q) => q.eq("userId", userId)).collect();
    const profile = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", userId)).first();

    return {
      tasks: tasks.map(({ userId: _u, ...rest }) => rest),
      projects: projects.map(({ userId: _u, ...rest }) => rest),
      notes: allNotes.map(({ userId: _u, ...rest }) => rest),
      activities: activities.map(({ userId: _u, ...rest }) => rest),
      me: profile ? { name: profile.name, bio: profile.bio } : { name: "Você", bio: "" },
    };
  },
});
