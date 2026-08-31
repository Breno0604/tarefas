/**
 * Convex Schema Definition
 *
 * Mirrors the existing domain types from src/types/index.ts.
 * When running `npx convex dev`, this schema generates the backend tables.
 *
 * Tables:
 *   tasks      – core task data
 *   projects   – project containers
 *   categories – category labels
 *   notes      – per-task notes (linked to task)
 *   activities – audit trail
 *   reminders  – notification triggers
 *   trash      – soft-deleted tasks (30-day retention)
 *   profiles   – user profile (single row per userId)
 *   preferences – user preferences
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("done"),
      v.literal("cancelled")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    projectId: v.optional(v.string()),
    categoryId: v.optional(v.string()),
    dueDate: v.optional(v.string()),       // "YYYY-MM-DD"
    createdAt: v.string(),
    estimatedHours: v.optional(v.number()),
    progress: v.number(),
    tags: v.array(v.string()),
    subtasks: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        done: v.boolean(),
      })
    ),
    favorite: v.boolean(),
    recurrence: v.optional(
      v.union(
        v.literal("none"),
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly")
      )
    ),
    cancelReason: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_user_due", ["userId", "dueDate"])
    .index("by_user_project", ["userId", "projectId"])
    .index("by_user_category", ["userId", "categoryId"]),

  projects: defineTable({
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    due: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  categories: defineTable({
    userId: v.string(),
    name: v.string(),
    color: v.string(),
  }).index("by_user", ["userId"]),

  notes: defineTable({
    userId: v.string(),
    taskId: v.string(),
    text: v.string(),
    createdAt: v.string(),
  })
    .index("by_user_task", ["userId", "taskId"])
    .index("by_task", ["taskId"]),

  activities: defineTable({
    userId: v.string(),
    type: v.union(
      v.literal("create"),
      v.literal("status"),
      v.literal("priority"),
      v.literal("due"),
      v.literal("project"),
      v.literal("title"),
      v.literal("note"),
      v.literal("delete"),
      v.literal("restore"),
      v.literal("cancel"),
      v.literal("category")
    ),
    taskId: v.optional(v.string()),
    text: v.string(),
    createdAt: v.string(),
  }).index("by_user_created", ["userId", "createdAt"]),

  reminders: defineTable({
    userId: v.string(),
    type: v.literal("due"),
    title: v.string(),
    body: v.string(),
    taskId: v.string(),
    read: v.boolean(),
    createdAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_task", ["userId", "taskId"]),

  trash: defineTable({
    userId: v.string(),
    originalTaskId: v.string(),
    task: v.any(),       // Serialized Task object
    notes: v.any(),      // Serialized Note[] array
    deletedAt: v.string(),
  }).index("by_user", ["userId"]),

  profiles: defineTable({
    userId: v.string(),
    name: v.string(),
    bio: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  preferences: defineTable({
    userId: v.string(),
    soundAlerts: v.boolean(),
    compactMode: v.boolean(),
    dueDates: v.boolean(),
    firstDay: v.union(v.literal("sunday"), v.literal("monday")),
    theme: v.union(v.literal("light"), v.literal("dark")),
  }).index("by_user", ["userId"]),

  pairing_codes: defineTable({
    code: v.string(),
    userId: v.string(),
    createdAt: v.string(),
    expiresAt: v.string(),
  }).index("by_code", ["code"]),
});
