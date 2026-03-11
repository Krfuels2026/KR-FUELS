import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

export const getUserByUsername = internalQuery({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
  },
});

export const getUserById = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getUserBunks = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userBunkAccess")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getAllUsers = internalQuery({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map(({ passwordHash, ...user }) => user);
  },
});

export const getAllUserBunkAccess = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query("userBunkAccess").collect();
  },
});
