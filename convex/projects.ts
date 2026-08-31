/**
 * Project mutations and queries.
 * Maps to: CREATE_PROJECT action.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Create a project. */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    due: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject ?? "anonymous";

    const projectId = await ctx.db.insert("projects", {
      userId,
      name: args.name,
      description: args.description ?? "",
      color: args.color ?? "#6366f1",
      due: args.due ?? undefined,
    });

    await ctx.db.insert("activities", {
      userId,
      type: "project",
      text: `Você criou o projeto "${args.name}"`,
      createdAt: new Date().toISOString(),
    });

    return projectId;
  },
});

/** List all projects. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject ?? "anonymous";
    return await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

/** Delete a project. */
export const remove = mutation({
  args: { projectId: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.projectId as any);
  },
});
