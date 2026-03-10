import { query } from "../_generated/server";
import { v } from "convex/values";

export const getVouchersByBunk = query({
  args: { bunkId: v.id("bunks") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("vouchers")
      .withIndex("by_bunk_and_date", (q) => q.eq("bunkId", args.bunkId))
      .collect();
  },
});

export const getAllVouchers = query({
  handler: async (ctx) => {
    return await ctx.db.query("vouchers").collect();
  },
});
