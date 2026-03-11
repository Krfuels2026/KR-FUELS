import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * KR-FUELS Database Schema
 * Migrated from PostgreSQL to Convex
 * Includes custom authentication (username/password)
 */
export default defineSchema({
  // ──────────────────────────────────────────────────
  // 1. BUNKS — Fuel Station Locations
  // ──────────────────────────────────────────────────
  bunks: defineTable({
    name: v.string(),       // 'KR FUELS - UDUMELPET'
    code: v.string(),       // 'UDM01' (unique, indexed)
    location: v.string(),   // 'Udumelpettai'
    createdAt: v.number(),  // Unix timestamp (ms)
  }).index("by_code", ["code"]),

  // ──────────────────────────────────────────────────
  // 2. USERS — Admin / Super-Admin Users
  // ──────────────────────────────────────────────────
  users: defineTable({
    username: v.string(),      // Unique (indexed)
    passwordHash: v.string(),  // bcrypt hash
    name: v.string(),
    role: v.union(v.literal("admin"), v.literal("super_admin")),
    createdAt: v.number(),
  }).index("by_username", ["username"]),

  // ──────────────────────────────────────────────────
  // 3. USER_BUNK_ACCESS — Many-to-Many Junction
  // ──────────────────────────────────────────────────
  userBunkAccess: defineTable({
    userId: v.id("users"),
    bunkId: v.id("bunks"),
  })
    .index("by_user", ["userId"])
    .index("by_bunk", ["bunkId"])
    .index("by_user_and_bunk", ["userId", "bunkId"]),

  // ──────────────────────────────────────────────────
  // 4. ACCOUNTS — Chart of Accounts (Hierarchical)
  // ──────────────────────────────────────────────────
  accounts: defineTable({
    name: v.string(),
    parentId: v.optional(v.id("accounts")),  // Self-referencing
    openingDebit: v.number(),
    openingCredit: v.number(),
    bunkId: v.id("bunks"),
    createdAt: v.number(),
  })
    .index("by_bunk", ["bunkId"])
    .index("by_parent", ["parentId"]),

  // ──────────────────────────────────────────────────
  // 5. VOUCHERS — Daily Transactions
  // ──────────────────────────────────────────────────
  vouchers: defineTable({
    txnDate: v.string(),     // 'YYYY-MM-DD'
    accountId: v.id("accounts"),
    debit: v.number(),
    credit: v.number(),
    description: v.string(),
    bunkId: v.id("bunks"),
    createdAt: v.number(),
  })
    .index("by_bunk_and_date", ["bunkId", "txnDate"])
    .index("by_account", ["accountId"]),

  // ──────────────────────────────────────────────────
  // 6. REMINDERS — Task / Reminder Items
  // ──────────────────────────────────────────────────
  reminders: defineTable({
    title: v.string(),
    description: v.string(),
    reminderDate: v.string(),  // 'YYYY-MM-DD'
    dueDate: v.string(),       // 'YYYY-MM-DD'
    createdBy: v.string(),     // username
    createdAt: v.number(),
  })
    .index("by_due_date", ["dueDate"])
    .index("by_reminder_date", ["reminderDate"]),

  // ──────────────────────────────────────────────────
  // 7. LOGIN_ATTEMPTS — Security: Rate Limiting & Lockout
  // ──────────────────────────────────────────────────
  loginAttempts: defineTable({
    username: v.string(),       // Attempted username
    success: v.boolean(),       // Was login successful?
    ipAddress: v.optional(v.string()), // Client IP (if available)
    timestamp: v.number(),      // Unix timestamp (ms)
  })
    .index("by_username", ["username"])
    .index("by_username_and_time", ["username", "timestamp"]),
});
