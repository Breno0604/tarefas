/**
 * Reminder mutations and queries.
 * Maps to: MARK_REMINDER_READ, MARK_ALL_REMINDERS_READ, CLEAR_REMINDERS actions.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Mark a single reminder as read. */
export const markRead = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id as any, { read: true });
  },
});

/** Mark all reminders as read. */
export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject ?? "anonymous";
    const reminders = await ctx.db
      .query("reminders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const r of reminders) {
      if (!r.read) {
        await ctx.db.patch(r._id, { read: true });
      }
    }
  },
});

/** Clear all reminders. */
export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject ?? "anonymous";
    const reminders = await ctx.db
      .query("reminders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const r of reminders) {
      await ctx.db.delete(r._id);
    }
  },
});

/** List all reminders for the current user. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject ?? "anonymous";
    return await ctx.db
      .query("reminders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});
