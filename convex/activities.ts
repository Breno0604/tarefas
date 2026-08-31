/**
 * Activities queries.
 */

import { query } from "./_generated/server";

/** List all activities for the current user, newest first. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject ?? "anonymous";
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .order("desc")
      .take(500);
    return activities;
  },
});
