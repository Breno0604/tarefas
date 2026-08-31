import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const docs = await ctx.db.query("preferences").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    return docs[0] ?? null;
  },
});

export const upsert = mutation({
  args: {
    userId: v.string(),
    soundAlerts: v.boolean(),
    compactMode: v.boolean(),
    dueDates: v.boolean(),
    firstDay: v.union(v.literal("sunday"), v.literal("monday")),
    theme: v.union(v.literal("light"), v.literal("dark")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("preferences").withIndex("by_user", (q) => q.eq("userId", args.userId)).first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("preferences", args);
    }
  },
});
