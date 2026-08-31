/**
 * Category mutations and queries.
 * Maps to: CREATE_CATEGORY action.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Create a category. */
export const create = mutation({
  args: {
    name: v.string(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject ?? "anonymous";

    const categoryId = await ctx.db.insert("categories", {
      userId,
      name: args.name,
      color: args.color ?? "#94a3b8",
    });

    await ctx.db.insert("activities", {
      userId,
      type: "category",
      text: `Você criou a categoria "${args.name}"`,
      createdAt: new Date().toISOString(),
    });

    return categoryId;
  },
});

/** List all categories. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject ?? "anonymous";
    return await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

/** Delete a category. */
export const remove = mutation({
  args: { categoryId: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.categoryId as any);
  },
});
