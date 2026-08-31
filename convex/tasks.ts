/**
 * Task mutations for Convex.
 *
 * Each function corresponds to a reducer action from src/store/store.tsx.
 * Business logic is imported from src/domain/tasks.ts.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { uid } from "../../src/domain/tasks";

/**
 * Create a new task.
 * Maps to: CREATE_TASK action.
 */
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("todo"),
        v.literal("in_progress"),
        v.literal("done"),
        v.literal("cancelled")
      )
    ),
    priority: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("urgent")
      )
    ),
    projectId: v.optional(v.string()),
    categoryId: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    estimatedHours: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    subtasks: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          done: v.boolean(),
        })
      )
    ),
    favorite: v.optional(v.boolean()),
    recurrence: v.optional(
      v.union(
        v.literal("none"),
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly")
      )
    ),
  },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject ?? "anonymous";
    const taskId = uid("t");
    await ctx.db.insert("tasks", {
      userId,
      title: args.title,
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
    });

    // Create activity entry
    await ctx.db.insert("activities", {
      userId,
      type: "create",
      taskId,
      text: `Você criou a tarefa "${args.title}"`,
      createdAt: new Date().toISOString(),
    });

    return taskId;
  },
});

/**
 * Update a task by ID.
 * Maps to: UPDATE_TASK action.
 */
export const update = mutation({
  args: {
    taskId: v.string(),
    patch: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      status: v.optional(
        v.union(
          v.literal("todo"),
          v.literal("in_progress"),
          v.literal("done"),
          v.literal("cancelled")
        )
      ),
      priority: v.optional(
        v.union(
          v.literal("low"),
          v.literal("medium"),
          v.literal("high"),
          v.literal("urgent")
        )
      ),
      projectId: v.optional(v.string()),
      categoryId: v.optional(v.string()),
      dueDate: v.optional(v.string()),
      estimatedHours: v.optional(v.number()),
      progress: v.optional(v.number()),
      tags: v.optional(v.array(v.string())),
      favorite: v.optional(v.boolean()),
      recurrence: v.optional(
        v.union(
          v.literal("none"),
          v.literal("daily"),
          v.literal("weekly"),
          v.literal("monthly")
        )
      ),
      cancelReason: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject ?? "anonymous";
    const task = await ctx.db.get(args.taskId as any);
    if (!task || task.userId !== userId) return;

    // Apply patch
    const updates: Record<string, any> = {};
    for (const [key, value] of Object.entries(args.patch)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(args.taskId as any, updates);

    // Create activity entries for significant changes
    if (args.patch.status && args.patch.status !== task.status) {
      const STATUS_LABELS: Record<string, string> = {
        todo: "A fazer",
        in_progress: "Em andamento",
        done: "Concluída",
        cancelled: "Cancelada",
      };
      await ctx.db.insert("activities", {
        userId,
        type: "status",
        taskId: args.taskId,
        text: `Você moveu "${task.title}" para ${STATUS_LABELS[args.patch.status]}`,
        createdAt: new Date().toISOString(),
      });
    }
  },
});

/**
 * Toggle task done status.
 * Maps to: TOGGLE_TASK_DONE action.
 */
export const toggleDone = mutation({
  args: { taskId: v.string() },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId as any);
    if (!task) return;

    const newStatus = task.status === "done" ? "in_progress" : "done";
    const progress = newStatus === "done" ? 100 : Math.min(task.progress, 99);

    await ctx.db.patch(args.taskId as any, { status: newStatus, progress });

    await ctx.db.insert("activities", {
      userId: task.userId,
      type: "status",
      taskId: args.taskId,
      text:
        newStatus === "done"
          ? `Você concluiu "${task.title}"`
          : `Você reabriu "${task.title}"`,
      createdAt: new Date().toISOString(),
    });
  },
});

/**
 * Complete a task.
 * Maps to: COMPLETE_TASK action.
 */
export const complete = mutation({
  args: { taskId: v.string() },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId as any);
    if (!task || task.status === "done" || task.status === "cancelled") return;

    await ctx.db.patch(args.taskId as any, { status: "done", progress: 100 });

    await ctx.db.insert("activities", {
      userId: task.userId,
      type: "status",
      taskId: args.taskId,
      text: `Você concluiu "${task.title}"`,
      createdAt: new Date().toISOString(),
    });
  },
});

/**
 * Reopen a task.
 * Maps to: REOPEN_TASK action.
 */
export const reopen = mutation({
  args: { taskId: v.string() },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId as any);
    if (!task || task.status !== "done") return;

    await ctx.db.patch(args.taskId as any, {
      status: "in_progress",
      progress: Math.min(task.progress, 99),
    });

    await ctx.db.insert("activities", {
      userId: task.userId,
      type: "status",
      taskId: args.taskId,
      text: `Você reabriu "${task.title}"`,
      createdAt: new Date().toISOString(),
    });
  },
});

/**
 * Set task status.
 * Maps to: SET_TASK_STATUS action.
 */
export const setStatus = mutation({
  args: {
    taskId: v.string(),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("done"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId as any);
    if (!task) return;

    const STATUS_LABELS: Record<string, string> = {
      todo: "A fazer",
      in_progress: "Em andamento",
      done: "Concluída",
      cancelled: "Cancelada",
    };

    const updates: Record<string, any> = { status: args.status };
    if (args.status === "done") updates.progress = 100;

    await ctx.db.patch(args.taskId as any, updates);

    await ctx.db.insert("activities", {
      userId: task.userId,
      type: "status",
      taskId: args.taskId,
      text: `Você moveu "${task.title}" para ${STATUS_LABELS[args.status]}`,
      createdAt: new Date().toISOString(),
    });
  },
});

/**
 * Cancel a task.
 * Maps to: CANCEL_TASK action.
 */
export const cancel = mutation({
  args: {
    taskId: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId as any);
    if (!task || task.status === "done" || task.status === "cancelled") return;

    await ctx.db.patch(args.taskId as any, {
      status: "cancelled",
      cancelReason: args.reason ?? undefined,
    });

    const actText = args.reason
      ? `Você cancelou "${task.title}": "${args.reason}"`
      : `Você cancelou "${task.title}"`;

    await ctx.db.insert("activities", {
      userId: task.userId,
      type: "cancel",
      taskId: args.taskId,
      text: actText,
      createdAt: new Date().toISOString(),
    });
  },
});

/**
 * Delete a task (soft delete to trash).
 * Maps to: DELETE_TASK action.
 */
export const remove = mutation({
  args: { taskId: v.string() },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId as any);
    if (!task) return;

    // Get notes for this task
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();

    // Move to trash
    await ctx.db.insert("trash", {
      userId: task.userId,
      originalTaskId: task._id.toString(),
      task: { ...task, _id: undefined, _creationTime: undefined },
      notes: notes.map((n) => ({ ...n, _id: undefined, _creationTime: undefined })),
      deletedAt: new Date().toISOString(),
    });

    // Delete notes
    for (const note of notes) {
      await ctx.db.delete(note._id);
    }

    // Delete task
    await ctx.db.delete(args.taskId as any);

    await ctx.db.insert("activities", {
      userId: task.userId,
      type: "delete",
      text: `Você excluiu a tarefa "${task.title}"`,
      createdAt: new Date().toISOString(),
    });
  },
});

/**
 * Toggle favorite.
 * Maps to: TOGGLE_FAVORITE action.
 */
export const toggleFavorite = mutation({
  args: { taskId: v.string() },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId as any);
    if (!task) return;
    await ctx.db.patch(args.taskId as any, { favorite: !task.favorite });
  },
});

/**
 * Duplicate a task.
 * Maps to: DUPLICATE_TASK action.
 */
export const duplicate = mutation({
  args: { taskId: v.string() },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.taskId as any);
    if (!source) return;

    const newId = uid("t");
    await ctx.db.insert("tasks", {
      ...source,
      _id: undefined,
      _creationTime: undefined,
      title: `${source.title} (cópia)`,
      createdAt: new Date().toISOString(),
      status: "todo",
      progress: 0,
      subtasks: source.subtasks.map((s: any) => ({
        ...s,
        id: uid("s"),
        done: false,
      })),
    });

    await ctx.db.insert("activities", {
      userId: source.userId,
      type: "create",
      text: `Você duplicou a tarefa "${source.title}"`,
      createdAt: new Date().toISOString(),
    });

    return newId;
  },
});

/**
 * Toggle a subtask.
 * Maps to: TOGGLE_SUBTASK action.
 */
export const toggleSubtask = mutation({
  args: {
    taskId: v.string(),
    subtaskId: v.string(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId as any);
    if (!task) return;

    const subtasks = task.subtasks.map((s: any) =>
      s.id === args.subtaskId ? { ...s, done: !s.done } : s
    );

    const doneCount = subtasks.filter((s: any) => s.done).length;
    const progress =
      subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : 0;

    await ctx.db.patch(args.taskId as any, { subtasks, progress });
  },
});

// ── Queries ──────────────────────────────────────────────────

/** List all tasks for the current user. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject ?? "anonymous";
    return await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

/** Get a single task by ID. */
export const get = query({
  args: { taskId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.taskId as any);
  },
});
