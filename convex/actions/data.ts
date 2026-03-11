"use node";

import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import jwt from "jsonwebtoken";

/**
 * JWT-protected action wrappers for all data operations.
 * Every action verifies the caller's JWT before touching the database.
 */

type DecodedToken = { userId: string; username: string; role: string };

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable not set");
  return secret;
}

function requireAuth(token: string): DecodedToken {
  try {
    return jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] }) as DecodedToken;
  } catch {
    throw new Error("Unauthorized: invalid or expired session. Please log in again.");
  }
}

function requireSuperAdmin(decoded: DecodedToken): void {
  if (decoded.role !== "super_admin") {
    throw new Error("Forbidden: this operation requires super_admin privileges.");
  }
}

// ── Accounts ──────────────────────────────────────────────────────────────────

export const createAccount = action({
  args: {
    token: v.string(),
    name: v.string(),
    parentId: v.optional(v.id("accounts")),
    openingDebit: v.number(),
    openingCredit: v.number(),
    bunkId: v.id("bunks"),
  },
  handler: async (ctx, args) => {
    requireAuth(args.token);
    return await ctx.runMutation(internal.mutations.accounts.createAccount, {
      name: args.name,
      parentId: args.parentId,
      openingDebit: args.openingDebit,
      openingCredit: args.openingCredit,
      bunkId: args.bunkId,
    });
  },
});

export const updateAccount = action({
  args: {
    token: v.string(),
    id: v.id("accounts"),
    name: v.string(),
    parentId: v.optional(v.id("accounts")),
    openingDebit: v.number(),
    openingCredit: v.number(),
  },
  handler: async (ctx, args) => {
    requireAuth(args.token);
    return await ctx.runMutation(internal.mutations.accounts.updateAccount, {
      id: args.id,
      name: args.name,
      parentId: args.parentId,
      openingDebit: args.openingDebit,
      openingCredit: args.openingCredit,
    });
  },
});

export const deleteAccount = action({
  args: { token: v.string(), id: v.id("accounts") },
  handler: async (ctx, args) => {
    requireAuth(args.token);
    return await ctx.runMutation(internal.mutations.accounts.deleteAccount, { id: args.id });
  },
});

// ── Vouchers ──────────────────────────────────────────────────────────────────

export const createVoucher = action({
  args: {
    token: v.string(),
    txnDate: v.string(),
    accountId: v.id("accounts"),
    debit: v.number(),
    credit: v.number(),
    description: v.string(),
    bunkId: v.id("bunks"),
  },
  handler: async (ctx, args) => {
    requireAuth(args.token);
    return await ctx.runMutation(internal.mutations.vouchers.createVoucher, {
      txnDate: args.txnDate,
      accountId: args.accountId,
      debit: args.debit,
      credit: args.credit,
      description: args.description,
      bunkId: args.bunkId,
    });
  },
});

export const updateVoucher = action({
  args: {
    token: v.string(),
    id: v.id("vouchers"),
    txnDate: v.string(),
    accountId: v.id("accounts"),
    debit: v.number(),
    credit: v.number(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    requireAuth(args.token);
    return await ctx.runMutation(internal.mutations.vouchers.updateVoucher, {
      id: args.id,
      txnDate: args.txnDate,
      accountId: args.accountId,
      debit: args.debit,
      credit: args.credit,
      description: args.description,
    });
  },
});

export const deleteVoucher = action({
  args: { token: v.string(), id: v.id("vouchers") },
  handler: async (ctx, args) => {
    requireAuth(args.token);
    return await ctx.runMutation(internal.mutations.vouchers.deleteVoucher, { id: args.id });
  },
});

// ── Reminders ─────────────────────────────────────────────────────────────────

export const createReminder = action({
  args: {
    token: v.string(),
    title: v.string(),
    description: v.string(),
    reminderDate: v.string(),
    dueDate: v.string(),
  },
  handler: async (ctx, args) => {
    requireAuth(args.token);
    return await ctx.runMutation(internal.mutations.reminders.createReminder, {
      title: args.title,
      description: args.description,
      reminderDate: args.reminderDate,
      dueDate: args.dueDate,
    });
  },
});

export const updateReminder = action({
  args: {
    token: v.string(),
    id: v.id("reminders"),
    title: v.string(),
    description: v.string(),
    reminderDate: v.string(),
    dueDate: v.string(),
  },
  handler: async (ctx, args) => {
    requireAuth(args.token);
    return await ctx.runMutation(internal.mutations.reminders.updateReminder, {
      id: args.id,
      title: args.title,
      description: args.description,
      reminderDate: args.reminderDate,
      dueDate: args.dueDate,
    });
  },
});

export const deleteReminder = action({
  args: { token: v.string(), id: v.id("reminders") },
  handler: async (ctx, args) => {
    requireAuth(args.token);
    return await ctx.runMutation(internal.mutations.reminders.deleteReminder, { id: args.id });
  },
});

// ── Bunks (super_admin only) ──────────────────────────────────────────────────

export const createBunk = action({
  args: {
    token: v.string(),
    name: v.string(),
    code: v.string(),
    location: v.string(),
  },
  handler: async (ctx, args) => {
    const decoded = requireAuth(args.token);
    requireSuperAdmin(decoded);
    return await ctx.runMutation(internal.mutations.bunks.createBunk, {
      name: args.name,
      code: args.code,
      location: args.location,
    });
  },
});

export const deleteBunk = action({
  args: { token: v.string(), id: v.id("bunks") },
  handler: async (ctx, args) => {
    const decoded = requireAuth(args.token);
    requireSuperAdmin(decoded);
    return await ctx.runMutation(internal.mutations.bunks.deleteBunk, { id: args.id });
  },
});

// ── Users (super_admin only) ──────────────────────────────────────────────────

export const deleteUser = action({
  args: { token: v.string(), userId: v.id("users") },
  handler: async (ctx, args) => {
    const decoded = requireAuth(args.token);
    requireSuperAdmin(decoded);
    return await ctx.runMutation(internal.mutations.users.deleteUser, { userId: args.userId });
  },
});

// ── Protected reads (sensitive data) ──────────────────────────────────────────

export const getAllUsers = action({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const decoded = requireAuth(args.token);
    requireSuperAdmin(decoded);
    return await ctx.runQuery(internal.queries.users.getAllUsers);
  },
});

export const getAllUserBunkAccess = action({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    requireAuth(args.token);
    return await ctx.runQuery(internal.queries.users.getAllUserBunkAccess);
  },
});
