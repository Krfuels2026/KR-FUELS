import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const createAccount = internalMutation({
  args: {
    name: v.string(),
    parentId: v.optional(v.id("accounts")),
    openingDebit: v.number(),
    openingCredit: v.number(),
    bunkId: v.id("bunks"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("accounts", {
      name: args.name,
      parentId: args.parentId,
      openingDebit: args.openingDebit,
      openingCredit: args.openingCredit,
      bunkId: args.bunkId,
      createdAt: Date.now(),
    });
  },
});

export const updateAccount = internalMutation({
  args: {
    id: v.id("accounts"),
    name: v.string(),
    parentId: v.optional(v.id("accounts")),
    openingDebit: v.number(),
    openingCredit: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Account not found");
    await ctx.db.patch(args.id, {
      name: args.name,
      parentId: args.parentId,
      openingDebit: args.openingDebit,
      openingCredit: args.openingCredit,
    });
    return await ctx.db.get(args.id);
  },
});

export const deleteAccount = internalMutation({
  args: { id: v.id("accounts") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Account not found");
    // Check for child accounts
    const children = await ctx.db
      .query("accounts")
      .withIndex("by_parent", (q) => q.eq("parentId", args.id))
      .collect();
    if (children.length > 0) {
      throw new Error("Cannot delete account with sub-accounts.");
    }
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

