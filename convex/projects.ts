import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: { userId: v.string(), name: v.string(), description: v.optional(v.string()), color: v.optional(v.string()), due: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const projectId = await ctx.db.insert("projects", { userId: args.userId, name: args.name, description: args.description ?? "", color: args.color ?? "#6366f1", due: args.due ?? undefined });
    await ctx.db.insert("activities", { userId: args.userId, type: "project", text: `Você criou o projeto "${args.name}"`, createdAt: new Date().toISOString() });
    return projectId;
  },
});

export const update = mutation({
  args: { projectId: v.string(), patch: v.object({ name: v.optional(v.string()), description: v.optional(v.string()), color: v.optional(v.string()), due: v.optional(v.string()) }) },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(args.patch)) { if (v !== undefined) updates[k] = v; }
    await ctx.db.patch(args.projectId as any, updates);
  },
});

export const remove = mutation({
  args: { projectId: v.string() },
  handler: async (ctx, args) => { await ctx.db.delete(args.projectId as any); },
});

export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
  },
});
