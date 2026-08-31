/**
 * Notes mutations and queries.
 * Maps to: ADD_NOTE, DELETE_NOTE actions.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { uid } from "../../src/domain/tasks";

/** Add a note to a task. */
export const add = mutation({
  args: {
    taskId: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject ?? "anonymous";
    const task = await ctx.db.get(args.taskId as any);
    if (!task || !args.text.trim()) return;

    await ctx.db.insert("notes", {
      userId,
      taskId: args.taskId,
      text: args.text.trim(),
      createdAt: new Date().toISOString(),
    });

    await ctx.db.insert("activities", {
      userId,
      type: "note",
      taskId: args.taskId,
      text: `Você anotou algo em "${task.title}"`,
      createdAt: new Date().toISOString(),
    });
  },
});

/** Delete a note. */
export const remove = mutation({
  args: {
    taskId: v.string(),
    noteId: v.string(),
  },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();

    const note = notes.find((n) => n._id.toString() === args.noteId);
    if (note) {
      await ctx.db.delete(note._id);
    }
  },
});

/** List notes for a task. */
export const listByTask = query({
  args: { taskId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
  },
});
