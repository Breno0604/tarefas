/**
 * Trash mutations and queries.
 * Maps to: RESTORE_TASK, CLEAR_TRASH actions.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Restore tasks from trash. */
export const restore = mutation({
  args: {
    taskIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject ?? "anonymous";
    const ids = new Set(args.taskIds);

    const trashEntries = await ctx.db
      .query("trash")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const toRestore = trashEntries.filter((e) => ids.has(e.originalTaskId));

    for (const entry of toRestore) {
      // Re-insert task
      await ctx.db.insert("tasks", {
        ...entry.task,
        _id: undefined,
        _creationTime: undefined,
        userId,
      });

      // Re-insert notes
      if (Array.isArray(entry.notes)) {
        for (const note of entry.notes) {
          await ctx.db.insert("notes", {
            ...note,
            _id: undefined,
            _creationTime: undefined,
            userId,
            taskId: entry.originalTaskId,
          });
        }
      }

      // Delete from trash
      await ctx.db.delete(entry._id);

      // Activity
      await ctx.db.insert("activities", {
        userId,
        type: "restore",
        taskId: entry.originalTaskId,
        text: `Você restaurou a tarefa "${entry.task.title}"`,
        createdAt: new Date().toISOString(),
      });
    }
  },
});

/** Clear all trash. */
export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject ?? "anonymous";
    const entries = await ctx.db
      .query("trash")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const e of entries) {
      await ctx.db.delete(e._id);
    }
  },
});

/** List all trash entries. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject ?? "anonymous";
    return await ctx.db
      .query("trash")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});
