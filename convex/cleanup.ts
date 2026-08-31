/**
 * Scheduled cleanup functions for Convex.
 *
 * - Trash: removes entries older than 30 days
 * - Activities: keeps only the 500 most recent per user
 * - Pairing codes: removes expired codes
 *
 * Run via Convex crons or call manually.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Remove trash entries older than 30 days for a user. */
export const cleanTrash = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const entries = await ctx.db
      .query("trash")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    let deleted = 0;
    for (const entry of entries) {
      if (entry.deletedAt < cutoff) {
        await ctx.db.delete(entry._id);
        deleted++;
      }
    }
    return { deleted };
  },
});

/** Keep only the 500 most recent activities for a user. */
export const cleanActivities = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const MAX = 500;
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    let deleted = 0;
    if (activities.length > MAX) {
      const toDelete = activities.slice(MAX);
      for (const a of toDelete) {
        await ctx.db.delete(a._id);
        deleted++;
      }
    }
    return { deleted, total: activities.length };
  },
});

/** Remove expired pairing codes. */
export const cleanPairingCodes = mutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    const all = await ctx.db.query("pairing_codes").collect();
    let deleted = 0;
    for (const entry of all) {
      if (entry.expiresAt < now) {
        await ctx.db.delete(entry._id);
        deleted++;
      }
    }
    return { deleted };
  },
});

/** Run all cleanups for a user. */
export const cleanAll = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Trash cleanup
    const trashCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const trashEntries = await ctx.db
      .query("trash")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    let trashDeleted = 0;
    for (const entry of trashEntries) {
      if (entry.deletedAt < trashCutoff) {
        await ctx.db.delete(entry._id);
        trashDeleted++;
      }
    }

    // Activities cleanup (keep 500 most recent)
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    let activitiesDeleted = 0;
    if (activities.length > 500) {
      for (const a of activities.slice(500)) {
        await ctx.db.delete(a._id);
        activitiesDeleted++;
      }
    }

    // Pairing codes cleanup (expired)
    const now = new Date().toISOString();
    const codes = await ctx.db.query("pairing_codes").collect();
    let codesDeleted = 0;
    for (const c of codes) {
      if (c.expiresAt < now) {
        await ctx.db.delete(c._id);
        codesDeleted++;
      }
    }

    return { trashDeleted, activitiesDeleted, codesDeleted };
  },
});

/** Query: count records per table for a user (for dashboard). */
export const counts = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const tasks = await ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    const projects = await ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    const categories = await ctx.db.query("categories").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    const notes = await ctx.db.query("notes").withIndex("by_user_task", (q) => q.eq("userId", args.userId)).collect();
    const activities = await ctx.db.query("activities").withIndex("by_user_created", (q) => q.eq("userId", args.userId)).collect();
    const trash = await ctx.db.query("trash").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    return {
      tasks: tasks.length,
      projects: projects.length,
      categories: categories.length,
      notes: notes.length,
      activities: activities.length,
      trash: trash.length,
    };
  },
});
