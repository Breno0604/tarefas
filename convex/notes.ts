import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const add = mutation({
  args: { userId: v.string(), taskId: v.string(), text: v.string() },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId as any) as any;
    if (!task || !args.text.trim()) return;
    const noteId = await ctx.db.insert("notes", { userId: args.userId, taskId: args.taskId, text: args.text.trim(), createdAt: new Date().toISOString() });
    await ctx.db.insert("activities", { userId: args.userId, type: "note", taskId: args.taskId, text: `Você anotou algo em "${task.title}"`, createdAt: new Date().toISOString() });
    return noteId;
  },
});

export const remove = mutation({
  args: { userId: v.string(), taskId: v.string(), noteId: v.string() },
  handler: async (ctx, args) => {
    const notes = await ctx.db.query("notes").withIndex("by_user_task", (q) => q.eq("userId", args.userId).eq("taskId", args.taskId)).collect();
    const note = notes.find((n) => n._id.toString() === args.noteId);
    if (note) await ctx.db.delete(note._id);
  },
});

export const listByTask = query({
  args: { userId: v.string(), taskId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("notes").withIndex("by_user_task", (q) => q.eq("userId", args.userId).eq("taskId", args.taskId)).collect();
  },
});

export const listAll = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("notes").withIndex("by_user_task", (q) => q.eq("userId", args.userId)).collect();
  },
});
