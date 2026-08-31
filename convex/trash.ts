import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const restore = mutation({
  args: { userId: v.string(), taskIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const ids = new Set(args.taskIds);
    const entries = await ctx.db.query("trash").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    const toRestore = entries.filter((e) => ids.has(e.originalTaskId));
    for (const entry of toRestore) {
      await ctx.db.insert("tasks", { ...entry.task, _id: undefined, _creationTime: undefined, userId: args.userId });
      if (Array.isArray(entry.notes)) {
        for (const note of entry.notes) await ctx.db.insert("notes", { ...note, _id: undefined, _creationTime: undefined, userId: args.userId, taskId: entry.originalTaskId });
      }
      await ctx.db.delete(entry._id);
      await ctx.db.insert("activities", { userId: args.userId, type: "restore", taskId: entry.originalTaskId, text: `Você restaurou a tarefa "${entry.task.title}"`, createdAt: new Date().toISOString() });
    }
  },
});

export const clear = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const entries = await ctx.db.query("trash").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    for (const e of entries) await ctx.db.delete(e._id);
  },
});

export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("trash").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
  },
});
