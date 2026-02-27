import { query } from "../_generated/server";

/**
 * Bunks Queries
 * Read operations for bunks (fuel stations)
 */

/**
 * Get all bunks
 */
export const getAllBunks = query({
  handler: async (ctx) => {
    return await ctx.db.query("bunks").collect();
  },
});
