import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * User Mutations (Simple User Management)
 * Write operations for users table
 */

/**
 * Create a new user
 * Note: Password should already be hashed by the action
 */
export const createUser = mutation({
  args: {
    username: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    role: v.union(v.literal("admin"), v.literal("super_admin")),
    accessibleBunkIds: v.array(v.id("bunks")),
  },
  handler: async (ctx, args) => {
    // Create user
    const userId = await ctx.db.insert("users", {
      username: args.username,
      passwordHash: args.passwordHash,
      name: args.name,
      role: args.role,
      createdAt: Date.now(),
    });

    // Grant bunk access
    for (const bunkId of args.accessibleBunkIds) {
      await ctx.db.insert("userBunkAccess", {
        userId,
        bunkId,
      });
    }

    return userId;
  },
});

/**
 * Update user password
 * Note: New password should already be hashed by the action
 */
export const updatePassword = mutation({
  args: {
    userId: v.id("users"),
    newPasswordHash: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      passwordHash: args.newPasswordHash,
    });
    return { success: true };
  },
});

/**
 * Delete user
 */
export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Delete user's bunk access
    const accessRecords = await ctx.db
      .query("userBunkAccess")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const record of accessRecords) {
      await ctx.db.delete(record._id);
    }

    // Delete user
    await ctx.db.delete(args.userId);
    return { success: true };
  },
});
