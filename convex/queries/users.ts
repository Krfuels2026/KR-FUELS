import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * User Queries (Simple Authentication)
 * Read operations for users table
 */

/**
 * Get user by username (for login)
 */
export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
  },
});

/**
 * Get user's accessible bunks
 */
export const getUserBunks = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userBunkAccess")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

/**
 * Get all users (for admin)
 */
export const getAllUsers = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});
