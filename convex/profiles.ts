import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const docs = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    return docs[0] ?? null;
  },
});

export const upsert = mutation({
  args: { userId: v.string(), name: v.string(), bio: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", args.userId)).first();
    if (existing) {
      await ctx.db.patch(existing._id, { name: args.name, bio: args.bio ?? "" });
    } else {
      await ctx.db.insert("profiles", { userId: args.userId, name: args.name, bio: args.bio ?? "" });
    }
  },
});
