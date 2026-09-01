/**
 * Task mutations and queries for Convex.
 * Accepts userId from client (no auth required).
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { uid } from "./helpers";

/**
 * Compute next recurrence date using calendar math.
 * Handles monthly clamping (e.g. 31 jan → 28 feb).
 */
function nextRecurrenceDate(dueDate: string, recurrence: string): string | null {
  if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return null;
  const parts = dueDate.split("-").map(Number);
  let year = parts[0], month = parts[1] - 1, day = parts[2];
  switch (recurrence) {
    case "daily": {
      const next = new Date(year, month, day + 1);
      return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
    }
    case "weekly": {
      const next = new Date(year, month, day + 7);
      return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
    }
    case "monthly": {
      const nextMonth = month + 1;
      const nextYear = nextMonth > 11 ? year + 1 : year;
      const normalizedMonth = nextMonth % 12;
      const maxDay = new Date(nextYear, normalizedMonth + 1, 0).getDate();
      const clampedDay = Math.min(day, maxDay);
      return `${nextYear}-${String(normalizedMonth + 1).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`;
    }
    default:
      return null;
  }
}

/** Today's date key YYYY-MM-DD in local-ish time. */
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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
    // Generate detailed activity entries for each changed field
    const LABELS: Record<string, string> = { todo: "A fazer", in_progress: "Em andamento", done: "Concluída", cancelled: "Cancelada" };
    const PRIO_LABELS: Record<string, string> = { low: "Baixa", medium: "Média", high: "Alta", urgent: "Urgente" };
    const now = new Date().toISOString();
    if (args.patch.status && args.patch.status !== task.status) {
      await ctx.db.insert("activities", { userId: args.userId, type: "status", taskId: args.taskId, text: `Você moveu "${task.title}" para ${LABELS[args.patch.status]}`, createdAt: now });
    }
    if (args.patch.priority && args.patch.priority !== task.priority) {
      const ranks: Record<string, number> = { low: 0, medium: 1, high: 2, urgent: 3 };
      const dir = (ranks[args.patch.priority] || 0) > (ranks[task.priority] || 0) ? "aumentou" : "reduziu";
      await ctx.db.insert("activities", { userId: args.userId, type: "priority", taskId: args.taskId, text: `Você ${dir} a prioridade de "${task.title}" para ${PRIO_LABELS[args.patch.priority]}`, createdAt: now });
    }
    if (args.patch.dueDate !== undefined && args.patch.dueDate !== task.dueDate) {
      const text = args.patch.dueDate
        ? `Você alterou o vencimento de "${task.title}" para ${args.patch.dueDate}`
        : `Você removeu o vencimento de "${task.title}"`;
      await ctx.db.insert("activities", { userId: args.userId, type: "due", taskId: args.taskId, text, createdAt: now });
    }
    if (args.patch.projectId !== undefined && args.patch.projectId !== task.projectId) {
      const text = args.patch.projectId
        ? `Você moveu "${task.title}" para um projeto`
        : `Você removeu "${task.title}" do projeto`;
      await ctx.db.insert("activities", { userId: args.userId, type: "project", taskId: args.taskId, text, createdAt: now });
    }
    if (args.patch.title && args.patch.title !== task.title) {
      await ctx.db.insert("activities", { userId: args.userId, type: "title", taskId: args.taskId, text: `Você renomeou a tarefa "${task.title}" para "${args.patch.title}"`, createdAt: now });
    }
    if (args.patch.categoryId !== undefined && args.patch.categoryId !== task.categoryId) {
      const text = args.patch.categoryId
        ? `Você moveu "${task.title}" para uma categoria`
        : `Você removeu "${task.title}" da categoria`;
      await ctx.db.insert("activities", { userId: args.userId, type: "category", taskId: args.taskId, text, createdAt: now });
    }
  },
});

export const toggleDone = mutation({
  args: { userId: v.string(), taskId: v.string() },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId as any) as any;
    if (!task || task.userId !== args.userId) return;
    const newStatus = task.status === "done" ? "in_progress" : "done";
    const progress = newStatus === "done" ? 100 : Math.min(task.progress, 99);
    await ctx.db.patch(args.taskId as any, { status: newStatus, progress });
    await ctx.db.insert("activities", { userId: args.userId, type: "status", taskId: args.taskId, text: newStatus === "done" ? `Você concluiu "${task.title}"` : `Você reabriu "${task.title}"`, createdAt: new Date().toISOString() });
    // Spawn next recurrence when completing
    if (newStatus === "done" && task.recurrence && task.recurrence !== "none") {
      let nextDue = task.dueDate ? nextRecurrenceDate(task.dueDate, task.recurrence) : null;
      if (nextDue && nextDue < todayKey()) {
        nextDue = nextRecurrenceDate(todayKey(), task.recurrence);
      }
      if (nextDue && nextDue >= todayKey()) {
        const spawnedId = await ctx.db.insert("tasks", {
          userId: args.userId,
          title: task.title,
          description: task.description ?? "",
          status: "todo",
          priority: task.priority,
          projectId: task.projectId,
          categoryId: task.categoryId,
          dueDate: nextDue,
          createdAt: new Date().toISOString(),
          estimatedHours: task.estimatedHours ?? 0,
          progress: 0,
          tags: [...(task.tags ?? [])],
          subtasks: (task.subtasks ?? []).map((s: any) => ({ ...s, id: uid("s"), done: false })),
          favorite: false,
          recurrence: task.recurrence,
          cancelReason: undefined,
        });
        await ctx.db.insert("activities", {
          userId: args.userId,
          type: "create",
          taskId: spawnedId.toString(),
          text: `Próxima ocorrência de "${task.title}" criada para ${nextDue}`,
          createdAt: new Date().toISOString(),
        });
      }
    }
  },
});

export const complete = mutation({
  args: { userId: v.string(), taskId: v.string() },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId as any) as any;
    if (!task || task.status === "done" || task.status === "cancelled") return;
    await ctx.db.patch(args.taskId as any, { status: "done", progress: 100 });
    await ctx.db.insert("activities", { userId: args.userId, type: "status", taskId: args.taskId, text: `Você concluiu "${task.title}"`, createdAt: new Date().toISOString() });
    // Spawn next recurrence if applicable
    if (task.recurrence && task.recurrence !== "none") {
      let nextDue = task.dueDate ? nextRecurrenceDate(task.dueDate, task.recurrence) : null;
      if (nextDue && nextDue < todayKey()) {
        nextDue = nextRecurrenceDate(todayKey(), task.recurrence);
      }
      if (nextDue && nextDue >= todayKey()) {
        const spawnedId = await ctx.db.insert("tasks", {
          userId: args.userId,
          title: task.title,
          description: task.description ?? "",
          status: "todo",
          priority: task.priority,
          projectId: task.projectId,
          categoryId: task.categoryId,
          dueDate: nextDue,
          createdAt: new Date().toISOString(),
          estimatedHours: task.estimatedHours ?? 0,
          progress: 0,
          tags: [...(task.tags ?? [])],
          subtasks: (task.subtasks ?? []).map((s: any) => ({ ...s, id: uid("s"), done: false })),
          favorite: false,
          recurrence: task.recurrence,
          cancelReason: undefined,
        });
        await ctx.db.insert("activities", {
          userId: args.userId,
          type: "create",
          taskId: spawnedId.toString(),
          text: `Próxima ocorrência de "${task.title}" criada para ${nextDue}`,
          createdAt: new Date().toISOString(),
        });
      }
    }
  },
});

export const reopen = mutation({
  args: { userId: v.string(), taskId: v.string() },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId as any) as any;
    if (!task || task.userId !== args.userId || task.status !== "done") return;
    await ctx.db.patch(args.taskId as any, { status: "todo", progress: 0 });
    await ctx.db.insert("activities", { userId: args.userId, type: "status", taskId: args.taskId, text: `Você reabriu "${task.title}"`, createdAt: new Date().toISOString() });
  },
});

export const setStatus = mutation({
  args: { userId: v.string(), taskId: v.string(), status: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("done"), v.literal("cancelled")) },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId as any) as any;
    if (!task || task.userId !== args.userId) return;
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
    if (!task || task.userId !== args.userId || task.status === "done" || task.status === "cancelled") return;
    await ctx.db.patch(args.taskId as any, { status: "cancelled", cancelReason: args.reason ?? undefined });
    const text = args.reason ? `Você cancelou "${task.title}": "${args.reason}"` : `Você cancelou "${task.title}"`;
    await ctx.db.insert("activities", { userId: args.userId, type: "cancel", taskId: args.taskId, text, createdAt: new Date().toISOString() });
  },
});

export const remove = mutation({
  args: { userId: v.string(), taskId: v.string() },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId as any) as any;
    if (!task || task.userId !== args.userId) return;
    const notes = await ctx.db.query("notes").withIndex("by_task", (q) => q.eq("taskId", args.taskId)).collect();
    // Store only the fields defined in the trash schema (keep userId inside task for restore)
    const { _id: _tId, _creationTime: _tCt, userId: _tUid, ...taskData } = task;
    const trashNotes = notes.map((n) => { const { _id, _creationTime, userId: _nUid, taskId: _nTid, ...noteData } = n; return noteData; });
    await ctx.db.insert("trash", { userId: args.userId, originalTaskId: task._id.toString(), task: { ...taskData, userId: args.userId }, notes: trashNotes, deletedAt: new Date().toISOString() });
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

export const toggleArchive = mutation({
  args: { userId: v.string(), taskId: v.string() },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId as any) as any;
    if (!task || task.userId !== args.userId) return;
    const newArchived = !task.archived;
    await ctx.db.patch(args.taskId as any, { archived: newArchived });
    await ctx.db.insert("activities", {
      userId: args.userId,
      type: "status",
      taskId: args.taskId,
      text: newArchived ? `Você arquivou "${task.title}"` : `Você desarquivou "${task.title}"`,
      createdAt: new Date().toISOString(),
    });
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
  args: { userId: v.string(), taskId: v.string() },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId as any) as any;
    if (!task || task.userId !== args.userId) return null;
    return task;
  },
});
