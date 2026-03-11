import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

// Record login attempt
export const recordAttempt = internalMutation({
  args: {
    username: v.string(),
    success: v.boolean(),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("loginAttempts", {
      username: args.username.toLowerCase().trim(),
      success: args.success,
      ipAddress: args.ipAddress,
      timestamp: Date.now(),
    });
  },
});

// Cleanup attempts older than 24h
export const cleanupOldAttempts = internalMutation({
  handler: async (ctx) => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const oldAttempts = await ctx.db
      .query("loginAttempts")
      .filter((q) => q.lt(q.field("timestamp"), cutoff))
      .collect();
    
    for (const attempt of oldAttempts) {
      await ctx.db.delete(attempt._id);
    }
    
    return { deleted: oldAttempts.length };
  },
});
