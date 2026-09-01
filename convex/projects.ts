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
  args: { userId: v.string(), projectId: v.string(), patch: v.object({ name: v.optional(v.string()), description: v.optional(v.string()), color: v.optional(v.string()), due: v.optional(v.string()) }) },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId as any) as any;
    if (!project || project.userId !== args.userId) return;
    const updates: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(args.patch)) { if (val !== undefined) updates[k] = val; }
    await ctx.db.patch(args.projectId as any, updates);
  },
});

export const remove = mutation({
  args: { userId: v.string(), projectId: v.string() },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId as any) as any;
    if (!project || project.userId !== args.userId) return;
    // Unlink all tasks from this project before deleting
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user_project", (q) => q.eq("userId", args.userId).eq("projectId", args.projectId))
      .collect();
    for (const task of tasks) {
      await ctx.db.patch(task._id, { projectId: undefined });
    }
    await ctx.db.delete(args.projectId as any);
    await ctx.db.insert("activities", {
      userId: args.userId,
      type: "project",
      text: `Você excluiu o projeto "${project.name}" (${tasks.length} tarefa(s) desvinculada(s))`,
      createdAt: new Date().toISOString(),
    });
  },
});

export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
  },
});
