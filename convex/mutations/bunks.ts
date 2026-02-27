import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Bunks Mutations
 * Write operations for bunks (fuel stations)
 */

/**
 * Create a new bunk
 */
export const createBunk = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    location: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("bunks", {
      name: args.name,
      code: args.code,
      location: args.location,
      createdAt: Date.now(),
    });
  },
});
