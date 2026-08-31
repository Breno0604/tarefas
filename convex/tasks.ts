/**
 * Task mutations and queries for Convex.
 * Accepts userId from client (no auth required).
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { uid } from "./helpers";

// ── Mutations ──────────────────────────────────────────────

export const create = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal("todo"), v.literal("in_progress"), v.literal("done"), v.literal("cancelled"))),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))),
    projectId: v.optional(v.string()),
    categoryId: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    estimatedHours: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    subtasks: v.optional(v.array(v.object({ id: v.string(), title: v.string(), done: v.boolean() }))),
    favorite: v.optional(v.boolean()),
    recurrence: v.optional(v.union(v.literal("none"), v.literal("daily"), v.literal("weekly"), v.literal("monthly"))),
  },
  handler: async (ctx, args) => {
    // Validate title is not empty
    if (!args.title || !args.title.trim()) return;
    const doc = {
      userId: args.userId,
      title: args.title.trim(),
      description: args.description ?? "",
      status: args.status ?? "todo",
      priority: args.priority ?? "medium",
      projectId: args.projectId ?? undefined,
      categoryId: args.categoryId ?? undefined,
      dueDate: args.dueDate ?? undefined,
      createdAt: new Date().toISOString(),
      estimatedHours: args.estimatedHours ?? 0,
      progress: 0,
      tags: args.tags ?? [],
      subtasks: args.subtasks ?? [],
      favorite: args.favorite ?? false,
      recurrence: args.recurrence ?? undefined,
      cancelReason: undefined,
    };
    const taskId = await ctx.db.insert("tasks", doc);
    await ctx.db.insert("activities", {
      userId: args.userId,
      type: "create",
      taskId: taskId.toString(),
      text: `Você criou a tarefa "${args.title}"`,
      createdAt: new Date().toISOString(),
    });
    return taskId;
  },
});

export const update = mutation({
  args: {
    userId: v.string(),
    taskId: v.string(),
    patch: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      status: v.optional(v.union(v.literal("todo"), v.literal("in_progress"), v.literal("done"), v.literal("cancelled"))),
      priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))),
      projectId: v.optional(v.string()),
      categoryId: v.optional(v.string()),
      dueDate: v.optional(v.string()),
      estimatedHours: v.optional(v.number()),
      progress: v.optional(v.number()),
      tags: v.optional(v.array(v.string())),
      favorite: v.optional(v.boolean()),
      recurrence: v.optional(v.union(v.literal("none"), v.literal("daily"), v.literal("weekly"), v.literal("monthly"))),
      cancelReason: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId as any) as any;
    if (!task || task.userId !== args.userId) return;
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(args.patch)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(args.taskId as any, updates);
    if (args.patch.status && args.patch.status !== task.status) {
      const LABELS: Record<string, string> = { todo: "A fazer", in_progress: "Em andamento", done: "Concluída", cancelled: "Cancelada" };
      await ctx.db.insert("activities", { userId: args.userId, type: "status", taskId: args.taskId, text: `Você moveu "${task.title}" para ${LABELS[args.patch.status]}`, createdAt: new Date().toISOString() });
    }
  },
});

export const toggleDone = mutation({
  args: { userId: v.string(), taskId: v.string() },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId as any) as any;
    if (!task) return;
    const newStatus = task.status === "done" ? "in_progress" : "done";
    const progress = newStatus === "done" ? 100 : Math.min(task.progress, 99);
    await ctx.db.patch(args.taskId as any, { status: newStatus, progress });
    await ctx.db.insert("activities", { userId: args.userId, type: "status", taskId: args.taskId, text: newStatus === "done" ? `Você concluiu "${task.title}"` : `Você reabriu "${task.title}"`, createdAt: new Date().toISOString() });
  },
});

export const complete = mutation({
  args: { userId: v.string(), taskId: v.string() },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId as any) as any;
    if (!task || task.status === "done" || task.status === "cancelled") return;
    await ctx.db.patch(args.taskId as any, { status: "done", progress: 100 });
    await ctx.db.insert("activities", { userId: args.userId, type: "status", taskId: args.taskId, text: `Você concluiu "${task.title}"`, createdAt: new Date().toISOString() });
  },
});

export const reopen = mutation({
  args: { userId: v.string(), taskId: v.string() },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId as any) as any;
    if (!task || task.status !== "done") return;
    await ctx.db.patch(args.taskId as any, { status: "in_progress", progress: Math.min(task.progress, 99) });
    await ctx.db.insert("activities", { userId: args.userId, type: "status", taskId: args.taskId, text: `Você reabriu "${task.title}"`, createdAt: new Date().toISOString() });
  },
});

export const setStatus = mutation({
  args: { userId: v.string(), taskId: v.string(), status: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("done"), v.literal("cancelled")) },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId as any) as any;
    if (!task) return;
    const LABELS: Record<string, string> = { todo: "A fazer", in_progress: "Em andamento", done: "Concluída", cancelled: "Cancelada" };
    const updates: Record<string, unknown> = { status: args.status };
    if (args.status === "done") updates.progress = 100;
    await ctx.db.patch(args.taskId as any, updates);
    await ctx.db.insert("activities", { userId: args.userId, type: "status", taskId: args.taskId, text: `Você moveu "${task.title}" para ${LABELS[args.status]}`, createdAt: new Date().toISOString() });
  },
});

export const cancel = mutation({
  args: { userId: v.string(), taskId: v.string(), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId as any) as any;
    if (!task || task.status === "done" || task.status === "cancelled") return;
    await ctx.db.patch(args.taskId as any, { status: "cancelled", cancelReason: args.reason ?? undefined });
    const text = args.reason ? `Você cancelou "${task.title}": "${args.reason}"` : `Você cancelou "${task.title}"`;
    await ctx.db.insert("activities", { userId: args.userId, type: "cancel", taskId: args.taskId, text, createdAt: new Date().toISOString() });
  },
});

export const remove = mutation({
  args: { userId: v.string(), taskId: v.string() },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId as any) as any;
    if (!task) return;
    const notes = await ctx.db.query("notes").withIndex("by_task", (q) => q.eq("taskId", args.taskId)).collect();
    await ctx.db.insert("trash", { userId: args.userId, originalTaskId: task._id.toString(), task: { ...task, _id: undefined, _creationTime: undefined }, notes: notes.map((n) => ({ ...n, _id: undefined, _creationTime: undefined })), deletedAt: new Date().toISOString() });
    for (const note of notes) await ctx.db.delete(note._id);
    await ctx.db.delete(args.taskId as any);
    await ctx.db.insert("activities", { userId: args.userId, type: "delete", text: `Você excluiu a tarefa "${task.title}"`, createdAt: new Date().toISOString() });
  },
});

export const toggleFavorite = mutation({
  args: { userId: v.string(), taskId: v.string() },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId as any) as any;
    if (!task || task.userId !== args.userId) return;
    await ctx.db.patch(args.taskId as any, { favorite: !task.favorite });
  },
});

export const duplicate = mutation({
  args: { userId: v.string(), taskId: v.string() },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.taskId as any) as any;
    if (!source) return;
    const newId = await ctx.db.insert("tasks", {
      userId: args.userId, title: `${source.title} (cópia)`, description: source.description ?? "", status: "todo", priority: source.priority,
      projectId: source.projectId, categoryId: source.categoryId, dueDate: source.dueDate, createdAt: new Date().toISOString(),
      estimatedHours: source.estimatedHours ?? 0, progress: 0, tags: [...(source.tags ?? [])], subtasks: (source.subtasks ?? []).map((s: any) => ({ ...s, id: uid("s"), done: false })),
      favorite: false, recurrence: source.recurrence ?? undefined, cancelReason: undefined,
    });
    await ctx.db.insert("activities", { userId: args.userId, type: "create", text: `Você duplicou a tarefa "${source.title}"`, createdAt: new Date().toISOString() });
    return newId;
  },
});

export const toggleSubtask = mutation({
  args: { userId: v.string(), taskId: v.string(), subtaskId: v.string() },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId as any) as any;
    if (!task || task.userId !== args.userId) return;
    const subtasks = task.subtasks.map((s: any) => s.id === args.subtaskId ? { ...s, done: !s.done } : s);
    const doneCount = subtasks.filter((s: any) => s.done).length;
    const progress = subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : 0;
    await ctx.db.patch(args.taskId as any, { subtasks, progress });
  },
});

// ── Queries ──────────────────────────────────────────────

export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
  },
});

export const get = query({
  args: { taskId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.taskId as any) as any;
  },
});
