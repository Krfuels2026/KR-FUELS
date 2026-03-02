import { mutation } from "../_generated/server";
import { v } from "convex/values";

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

export const deleteBunk = mutation({
  args: { id: v.id("bunks") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Bunk not found");
    // Remove all user bunk access records for this bunk
    const accessRecords = await ctx.db
      .query("userBunkAccess")
      .withIndex("by_bunk", (q) => q.eq("bunkId", args.id))
      .collect();
    for (const record of accessRecords) {
      await ctx.db.delete(record._id);
    }
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
