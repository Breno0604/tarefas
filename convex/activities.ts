import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("activities").withIndex("by_user_created", (q) => q.eq("userId", args.userId)).order("desc").take(500);
  },
});

export const remove = mutation({
  args: { activityId: v.id("activities"), userId: v.string() },
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.activityId);
    if (!activity || activity.userId !== args.userId) throw new Error("Not found");
    await ctx.db.delete(args.activityId);
  },
});
