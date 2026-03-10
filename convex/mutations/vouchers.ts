import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createVoucher = mutation({
  args: {
    txnDate: v.string(),
    accountId: v.id("accounts"),
    debit: v.number(),
    credit: v.number(),
    description: v.string(),
    bunkId: v.id("bunks"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("vouchers", {
      txnDate: args.txnDate,
      accountId: args.accountId,
      debit: args.debit,
      credit: args.credit,
      description: args.description,
      bunkId: args.bunkId,
      createdAt: Date.now(),
    });
  },
});

export const updateVoucher = mutation({
  args: {
    id: v.id("vouchers"),
    txnDate: v.string(),
    accountId: v.id("accounts"),
    debit: v.number(),
    credit: v.number(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Voucher not found");
    await ctx.db.patch(args.id, {
      txnDate: args.txnDate,
      accountId: args.accountId,
      debit: args.debit,
      credit: args.credit,
      description: args.description,
    });
    return await ctx.db.get(args.id);
  },
});

export const deleteVoucher = mutation({
  args: { id: v.id("vouchers") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Voucher not found");
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

