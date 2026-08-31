import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const markRead = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => { await ctx.db.patch(args.id as any, { read: true }); },
});

export const markAllRead = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const reminders = await ctx.db.query("reminders").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    for (const r of reminders) { if (!r.read) await ctx.db.patch(r._id, { read: true }); }
  },
});

export const create = mutation({
  args: { userId: v.string(), type: v.literal("due"), title: v.string(), body: v.string(), taskId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("reminders", { userId: args.userId, type: args.type, title: args.title, body: args.body, taskId: args.taskId, read: false, createdAt: new Date().toISOString() });
  },
});

export const clear = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const reminders = await ctx.db.query("reminders").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    for (const r of reminders) await ctx.db.delete(r._id);
  },
});

export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("reminders").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
  },
});
