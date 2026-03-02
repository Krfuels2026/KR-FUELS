import { query } from "../_generated/server";
import { v } from "convex/values";

export const getAccountsByBunk = query({
  args: { bunkId: v.id("bunks") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("accounts")
      .withIndex("by_bunk", (q) => q.eq("bunkId", args.bunkId))
      .collect();
  },
});

export const getAllAccounts = query({
  handler: async (ctx) => {
    return await ctx.db.query("accounts").collect();
  },
});
