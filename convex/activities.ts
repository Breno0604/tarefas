import { v } from "convex/values";
import { query } from "./_generated/server";

export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("activities").withIndex("by_user_created", (q) => q.eq("userId", args.userId)).order("desc").take(500);
  },
});
