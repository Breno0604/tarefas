/**
 * Pairing system — links multiple devices to the same userId.
 *
 * Flow:
 * 1. Device A calls `generateCode({ userId })` → gets a 6-digit code
 * 2. Device B calls `validateCode({ code })` → gets the userId from Device A
 * 3. Both devices store the same userId in localStorage
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Generate a 6-digit pairing code valid for 10 minutes. */
export const generateCode = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Remove any existing codes for this user
    const existing = await ctx.db
      .query("pairing_codes")
      .withIndex("by_code")
      .collect();
    for (const e of existing) {
      if (e.userId === args.userId) {
        await ctx.db.delete(e._id);
      }
    }

    // Generate unique 6-digit code (retry up to 5 times on collision)
    let code = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = String(Math.floor(100000 + Math.random() * 900000));
      const existing = await ctx.db
        .query("pairing_codes")
        .withIndex("by_code", (q) => q.eq("code", candidate))
        .first();
      if (!existing) {
        code = candidate;
        break;
      }
    }
    if (!code) return null; // collision after 5 attempts (extremely unlikely)
    const now = new Date();
    const expires = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

    await ctx.db.insert("pairing_codes", {
      code,
      userId: args.userId,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    });

    return code;
  },
});

/** Validate a pairing code and return the userId (read-only, no deletion). */
export const validateCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    if (!/^\d{6}$/.test(args.code.trim())) return null;

    const entries = await ctx.db
      .query("pairing_codes")
      .withIndex("by_code", (q) => q.eq("code", args.code.trim()))
      .collect();

    if (entries.length === 0) return null;

    const entry = entries[0];

    // Check expiration
    if (new Date(entry.expiresAt) < new Date()) {
      return null;
    }

    return { userId: entry.userId };
  },
});

/** Claim a pairing code (called by the device that wants to join). Returns userId. */
export const claimCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    if (!/^\d{6}$/.test(args.code.trim())) return null;

    const entries = await ctx.db
      .query("pairing_codes")
      .withIndex("by_code", (q) => q.eq("code", args.code.trim()))
      .collect();

    if (entries.length === 0) return null;

    const entry = entries[0];

    // Check expiration
    if (new Date(entry.expiresAt) < new Date()) {
      await ctx.db.delete(entry._id);
      return null;
    }

    // Delete the code after use
    await ctx.db.delete(entry._id);

    return { userId: entry.userId };
  },
});
