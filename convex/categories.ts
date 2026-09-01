import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: { userId: v.string(), name: v.string(), color: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const categoryId = await ctx.db.insert("categories", { userId: args.userId, name: args.name, color: args.color ?? "#94a3b8" });
    await ctx.db.insert("activities", { userId: args.userId, type: "category", text: `Você criou a categoria "${args.name}"`, createdAt: new Date().toISOString() });
    return categoryId;
  },
});

export const update = mutation({
  args: { userId: v.string(), categoryId: v.string(), patch: v.object({ name: v.optional(v.string()), color: v.optional(v.string()) }) },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId as any) as any;
    if (!category || category.userId !== args.userId) return;
    const updates: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(args.patch)) { if (val !== undefined) updates[k] = val; }
    await ctx.db.patch(args.categoryId as any, updates);
  },
});

export const remove = mutation({
  args: { userId: v.string(), categoryId: v.string() },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId as any) as any;
    if (!category || category.userId !== args.userId) return;
    // Unlink all tasks from this category before deleting
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user_category", (q) => q.eq("userId", args.userId).eq("categoryId", args.categoryId))
      .collect();
    for (const task of tasks) {
      await ctx.db.patch(task._id, { categoryId: undefined });
    }
    await ctx.db.delete(args.categoryId as any);
    await ctx.db.insert("activities", {
      userId: args.userId,
      type: "category",
      text: `Você excluiu a categoria "${category.name}" (${tasks.length} tarefa(s) desvinculada(s))`,
      createdAt: new Date().toISOString(),
    });
  },
});

export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("categories").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
  },
});
