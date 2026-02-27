# KR-FUELS: Migration to Convex Guide

> **Complete migration strategy** for moving KR-FUELS backend and database from NestJS/TypeORM/PostgreSQL to Convex — a serverless backend-as-a-service with integrated real-time database.

---

## Table of Contents

1. [Migration Overview](#migration-overview)
2. [Why Convex?](#why-convex)
3. [Architecture Comparison](#architecture-comparison)
4. [Pre-Migration Checklist](#pre-migration-checklist)
5. [Phase 1: Convex Setup](#phase-1-convex-setup)
6. [Phase 2: Schema Migration](#phase-2-schema-migration)
7. [Phase 3: Authentication Migration](#phase-3-authentication-migration)
8. [Phase 4: Business Logic Migration](#phase-4-business-logic-migration)
9. [Phase 5: Frontend Integration](#phase-5-frontend-integration)
10. [Phase 6: Data Migration](#phase-6-data-migration)
11. [Phase 7: Testing & Validation](#phase-7-testing--validation)
12. [Phase 8: Deployment](#phase-8-deployment)
13. [Rollback Strategy](#rollback-strategy)
14. [Cost Analysis](#cost-analysis)

---

## Migration Overview

### Current Stack (Before)
- **Backend**: NestJS + TypeORM
- **Database**: PostgreSQL
- **Auth**: JWT (custom implementation with passport-jwt)
- **API**: REST endpoints
- **Deployment**: Requires separate backend + database hosting

### Target Stack (After)
- **Backend + Database**: Convex (unified serverless platform)
- **Auth**: Convex Auth (built-in JWT + session management)
- **API**: Convex queries/mutations (auto-generated TypeScript client)
- **Real-time**: Built-in subscriptions (no polling needed)
- **Deployment**: Single `npx convex deploy` command

### Migration Timeline
- **Estimated Duration**: 2-3 weeks (incremental approach)
- **Downtime**: Zero (parallel deployment strategy)
- **Effort**: Medium (6 modules, 7 entities, 303 lines of schema)

---

## Why Convex?

### Benefits
✅ **Serverless**: No infrastructure management  
✅ **Real-time**: Automatic data subscriptions (useful for multi-user accounting)  
✅ **Type-Safe**: End-to-end TypeScript with auto-generated types  
✅ **Integrated Auth**: Built-in JWT + session handling  
✅ **Transactions**: ACID guarantees for accounting data  
✅ **Simplified Deployment**: Single command deploy (backend + DB)  
✅ **Developer Experience**: Hot-reload, local dev server, schema migrations  
✅ **Cost-Effective**: Free tier (100K monthly active users, 1GB storage)  
✅ **No SQL Required**: Query data with TypeScript, not SQL strings

### Trade-offs
⚠️ **Vendor Lock-in**: Convex-specific APIs (not SQL)  
⚠️ **Learning Curve**: Different paradigm from REST/TypeORM  
⚠️ **Query Limitations**: No raw SQL (use Convex query builders)  
⚠️ **Migration Effort**: Need to rewrite all services/controllers  
⚠️ **Recursive Queries**: More complex than PostgreSQL CTEs (but possible)

### When NOT to Migrate
❌ Complex SQL queries heavily dependent on PostgreSQL features  
❌ Large existing PostgreSQL dataset (>100GB migration overhead)  
❌ Team strongly prefers SQL over document-style queries  
❌ Regulatory requirements for specific database providers

---

## Architecture Comparison

### Current: NestJS + PostgreSQL

```
┌─────────────────┐
│  React Frontend │
│  (Vite + React  │
│   Router)       │
└────────┬────────┘
         │ REST API (fetch)
         ▼
┌─────────────────┐
│   NestJS API    │
│  ┌───────────┐  │
│  │Controllers│  │
│  │Services   │  │
│  │Guards     │  │
│  │DTOs       │  │
│  └─────┬─────┘  │
└────────┼────────┘
         │ TypeORM
         ▼
┌─────────────────┐
│   PostgreSQL    │
│  - 7 tables     │
│  - UUIDs        │
│  - Foreign Keys │
│  - Row-Level    │
│    Security     │
└─────────────────┘
```

### Target: Convex

```
┌─────────────────┐
│  React Frontend │
│  (Vite + React  │
│   Router)       │
└────────┬────────┘
         │ Convex Client
         │ (WebSocket + HTTP)
         │ Auto-reconnect
         │ Real-time sync
         ▼
┌─────────────────────────────┐
│         Convex Platform      │
│  ┌────────────────────────┐ │
│  │ Queries (read data)    │ │
│  │ Mutations (write data) │ │
│  │ Actions (external APIs)│ │
│  └───────────┬────────────┘ │
│              │              │
│  ┌───────────▼────────────┐ │
│  │   Convex Database      │ │
│  │  - 7 tables            │ │
│  │  - Auto-generated IDs  │ │
│  │  - Real-time sync      │ │
│  │  - ACID transactions   │ │
│  └────────────────────────┘ │
└─────────────────────────────┘
```

---

## Pre-Migration Checklist

### 1. Audit Current System
- [ ] Document all REST endpoints from 6 modules:
  - Auth: `/api/auth/login`
  - Users: `/api/users` (CRUD)
  - Bunks: `/api/bunks` (CRUD)
  - Accounts: `/api/accounts` (CRUD + hierarchy)
  - Vouchers: `/api/vouchers` (CRUD + date filtering)
  - Reminders: `/api/reminders` (CRUD)
- [ ] List all business logic in services
- [ ] Identify PostgreSQL-specific features (CTEs for account hierarchy)
- [ ] Map TypeORM entities → Convex tables

### 2. Data Inventory
- [ ] Count total records per table:
  - `bunks`: ~8 locations (from seed data)
  - `users`: TBD (check production)
  - `accounts`: TBD (hierarchical chart)
  - `vouchers`: TBD (daily transactions)
  - `reminders`: TBD
  - `user_bunk_access`: TBD
- [ ] Identify UUID usage (Convex uses auto-generated IDs)
- [ ] Check foreign key relationships
- [ ] Verify data integrity constraints

### 3. Environment Setup
- [ ] Create Convex account (https://convex.dev)
- [ ] Install Convex CLI: `npm install -g convex`
- [ ] Set up local development environment
- [ ] Create backup of current PostgreSQL database

### 4. Team Preparation
- [ ] Review Convex documentation (https://docs.convex.dev)
- [ ] Complete Convex tutorial (30 minutes)
- [ ] Understand query vs mutation vs action differences

---

## Phase 1: Convex Setup

### Step 1.1: Initialize Convex Project

```bash
# Navigate to project root
cd c:\Users\Srivarmaa\Desktop\HK\KR-FUELS

# Initialize Convex (creates convex/ folder)
npx convex dev --once

# Choose options:
# - Create new project: Yes
# - Project name: kr-fuels
# - Framework: React
```

### Step 1.2: Project Structure

After initialization, your project will have:

```
KR-FUELS/
├── convex/                    # ← New Convex backend folder
│   ├── schema.ts              # Database schema
│   ├── auth.config.ts         # Authentication setup
│   ├── queries/               # Read operations (create this)
│   │   ├── bunks.ts
│   │   ├── users.ts
│   │   ├── accounts.ts
│   │   ├── vouchers.ts
│   │   └── reminders.ts
│   ├── mutations/             # Write operations (create this)
│   │   ├── bunks.ts
│   │   ├── users.ts
│   │   ├── accounts.ts
│   │   ├── vouchers.ts
│   │   └── reminders.ts
│   ├── helpers/               # Utility functions (create this)
│   │   └── auth.ts
│   └── _generated/            # Auto-generated types
├── apps/
│   ├── backend/               # ← Keep for parallel deployment
│   │   └── ...
│   └── frontend/
│       ├── src/
│       ├── convex.config.ts   # ← Auto-generated Convex config
│       └── package.json
```

### Step 1.3: Install Dependencies

```bash
# Frontend dependencies
cd apps/frontend
npm install convex

# Backend dependencies (for bcrypt in Convex)
cd ../../convex
npm init -y
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

### Step 1.4: Configure Convex Client

**File**: `apps/frontend/src/main.tsx` (or `index.tsx`)

Update your root file to wrap the app with ConvexProvider:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import App from './App';
import './index.css';

// Initialize Convex client
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </React.StrictMode>
);
```

**File**: `apps/frontend/.env` (add)

```env
# Get this URL from `npx convex dev` output
VITE_CONVEX_URL=https://your-deployment-name.convex.cloud
```

---

## Phase 2: Schema Migration

### Step 2.1: Define Convex Schema

**File**: `convex/schema.ts`

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ──────────────────────────────────────────────────
  // 1. BUNKS — Fuel Station Locations
  // ──────────────────────────────────────────────────
  bunks: defineTable({
    name: v.string(),       // 'KR FUELS - UDUMELPET'
    code: v.string(),       // 'UDM01' (unique, indexed)
    location: v.string(),   // 'Udumelpettai'
    createdAt: v.number(),  // Unix timestamp (ms)
  }).index("by_code", ["code"]),  // Fast lookup by code

  // ──────────────────────────────────────────────────
  // 2. USERS — Admin / Super-Admin Users
  // ──────────────────────────────────────────────────
  users: defineTable({
    username: v.string(),      // Unique (indexed)
    passwordHash: v.string(),  // bcrypt hash
    name: v.string(),
    role: v.union(v.literal("admin"), v.literal("super_admin")),
    createdAt: v.number(),
  }).index("by_username", ["username"]),  // Fast login lookup

  // ──────────────────────────────────────────────────
  // 3. USER_BUNK_ACCESS — Many-to-Many Junction
  // ──────────────────────────────────────────────────
  userBunkAccess: defineTable({
    userId: v.id("users"),
    bunkId: v.id("bunks"),
  })
    .index("by_user", ["userId"])  // Get all bunks for a user
    .index("by_bunk", ["bunkId"])  // Get all users for a bunk
    .index("by_user_and_bunk", ["userId", "bunkId"]),  // Check specific access

  // ──────────────────────────────────────────────────
  // 4. ACCOUNTS — Chart of Accounts (Hierarchical)
  // ──────────────────────────────────────────────────
  accounts: defineTable({
    name: v.string(),
    parentId: v.optional(v.id("accounts")),  // Self-referencing (null = root)
    openingDebit: v.number(),
    openingCredit: v.number(),
    bunkId: v.id("bunks"),
    createdAt: v.number(),
  })
    .index("by_bunk", ["bunkId"])      // List accounts for a bunk
    .index("by_parent", ["parentId"]), // Traverse hierarchy

  // ──────────────────────────────────────────────────
  // 5. VOUCHERS — Daily Transactions
  // ──────────────────────────────────────────────────
  vouchers: defineTable({
    txnDate: v.string(),     // 'YYYY-MM-DD' (store as string for easy filtering)
    accountId: v.id("accounts"),
    debit: v.number(),
    credit: v.number(),
    description: v.string(),
    bunkId: v.id("bunks"),
    createdAt: v.number(),
  })
    .index("by_bunk_and_date", ["bunkId", "txnDate"])  // Date-range queries
    .index("by_account", ["accountId"]),                // Ledger queries

  // ──────────────────────────────────────────────────
  // 6. REMINDERS — Task / Reminder Items
  // ──────────────────────────────────────────────────
  reminders: defineTable({
    title: v.string(),
    description: v.string(),
    reminderDate: v.string(),  // 'YYYY-MM-DD'
    dueDate: v.string(),       // 'YYYY-MM-DD'
    createdBy: v.string(),     // username (not FK for simplicity)
    createdAt: v.number(),
  })
    .index("by_due_date", ["dueDate"])
    .index("by_reminder_date", ["reminderDate"]),
});
```

### Step 2.2: Key Differences from PostgreSQL

| PostgreSQL | Convex | Migration Notes |
|---|---|---|
| `UUID PRIMARY KEY` | `Id<"table_name">` | Auto-generated, e.g., `Id<"bunks">` |
| `REFERENCES bunks(id)` | `v.id("bunks")` | Type-safe foreign keys |
| `UNIQUE` constraint | `.index()` + validation | Enforce uniqueness in mutation logic |
| `CHECK` constraint | Validation in mutation | Validate `debit > 0 OR credit > 0` in code |
| `TIMESTAMPTZ` | `v.number()` | Store `Date.now()` (Unix ms) |
| `DATE` | `v.string()` | Store as 'YYYY-MM-DD' string |
| `ENUM('admin', 'super_admin')` | `v.union(v.literal(...))` | TypeScript union types |
| `ON DELETE CASCADE` | Manual deletion | Delete related records in mutations |

### Step 2.3: Deploy Schema

```bash
# Start Convex development server (auto-deploys schema)
npx convex dev
```

The schema will be automatically pushed to your Convex deployment.

---

## Phase 3: Authentication Migration

### Step 3.1: Install Convex Auth

```bash
cd convex
npm install @convex-dev/auth bcryptjs
npm install --save-dev @types/bcryptjs
```

### Step 3.2: Auth Configuration

**File**: `convex/auth.config.ts`

```typescript
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [],
});
```

### Step 3.3: Auth Helper Functions

**File**: `convex/helpers/auth.ts`

```typescript
import { QueryCtx, MutationCtx } from "../_generated/server";

/**
 * Get current authenticated user from context
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized: Please login");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_username", (q) => 
      q.eq("username", identity.subject)
    )
    .unique();

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

/**
 * Check if user has super_admin role
 */
export async function requireSuperAdmin(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx);
  
  if (user.role !== "super_admin") {
    throw new Error("Forbidden: super_admin access required");
  }

  return user;
}

/**
 * Check if user has access to a specific bunk
 */
export async function checkBunkAccess(
  ctx: QueryCtx | MutationCtx,
  bunkId: string
) {
  const user = await getCurrentUser(ctx);

  // Super admins have access to all bunks
  if (user.role === "super_admin") {
    return true;
  }

  // Check user_bunk_access
  const access = await ctx.db
    .query("userBunkAccess")
    .withIndex("by_user_and_bunk", (q) =>
      q.eq("userId", user._id).eq("bunkId", bunkId as any)
    )
    .unique();

  if (!access) {
    throw new Error("Forbidden: no access to this bunk");
  }

  return true;
}
```

### Step 3.4: Login Mutation

**File**: `convex/mutations/auth.ts`

```typescript
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";

/**
 * Login mutation (replaces POST /api/auth/login)
 */
export const login = mutation({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by username
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (!user) {
      throw new Error("Invalid username or password");
    }

    // Verify password
    const validPassword = await bcrypt.compare(args.password, user.passwordHash);
    if (!validPassword) {
      throw new Error("Invalid username or password");
    }

    // Get accessible bunks
    const accessibleBunks = await ctx.db
      .query("userBunkAccess")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const accessibleBunkIds = accessibleBunks.map((ab) => ab.bunkId);

    // Create session (Convex Auth handles JWT automatically)
    await ctx.auth.setUser({
      subject: user.username,
      name: user.name,
    });

    // Return user data
    return {
      id: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
      accessibleBunkIds,
    };
  },
});

/**
 * Logout mutation
 */
export const logout = mutation({
  handler: async (ctx) => {
    await ctx.auth.clearUser();
    return { success: true };
  },
});

/**
 * Get current user (replaces JWT decode)
 */
export const getCurrentUser = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", identity.subject))
      .unique();

    if (!user) {
      return null;
    }

    // Get accessible bunks
    const accessibleBunks = await ctx.db
      .query("userBunkAccess")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return {
      id: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
      accessibleBunkIds: accessibleBunks.map((ab) => ab.bunkId),
    };
  },
});
```

---

## Phase 4: Business Logic Migration

### 4.1: Bunks Module

**File**: `convex/queries/bunks.ts`

```typescript
import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../helpers/auth";

/**
 * Get all bunks (replaces GET /api/bunks)
 */
export const getAllBunks = query({
  handler: async (ctx) => {
    await getCurrentUser(ctx); // Require authentication
    return await ctx.db.query("bunks").order("asc").collect();
  },
});

/**
 * Get bunk by ID (replaces GET /api/bunks/:id)
 */
export const getBunkById = query({
  args: { id: v.id("bunks") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    return await ctx.db.get(args.id);
  },
});

/**
 * Get bunk by code (new - useful for lookups)
 */
export const getBunkByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    return await ctx.db
      .query("bunks")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
  },
});
```

**File**: `convex/mutations/bunks.ts`

```typescript
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireSuperAdmin } from "../helpers/auth";

/**
 * Create new bunk (replaces POST /api/bunks)
 */
export const createBunk = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    location: v.string(),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx); // Only super_admin can create bunks

    // Check unique code
    const existing = await ctx.db
      .query("bunks")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();

    if (existing) {
      throw new Error(`Bunk code '${args.code}' already exists`);
    }

    // Validate inputs
    if (!args.name.trim()) throw new Error("Name is required");
    if (!args.code.trim()) throw new Error("Code is required");
    if (!args.location.trim()) throw new Error("Location is required");

    // Insert
    const bunkId = await ctx.db.insert("bunks", {
      name: args.name.trim(),
      code: args.code.trim().toUpperCase(),
      location: args.location.trim(),
      createdAt: Date.now(),
    });

    return await ctx.db.get(bunkId);
  },
});

/**
 * Update bunk (replaces PATCH /api/bunks/:id)
 */
export const updateBunk = mutation({
  args: {
    id: v.id("bunks"),
    name: v.string(),
    location: v.string(),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    if (!args.name.trim()) throw new Error("Name is required");
    if (!args.location.trim()) throw new Error("Location is required");

    await ctx.db.patch(args.id, {
      name: args.name.trim(),
      location: args.location.trim(),
    });

    return await ctx.db.get(args.id);
  },
});

/**
 * Delete bunk (replaces DELETE /api/bunks/:id)
 */
export const deleteBunk = mutation({
  args: { id: v.id("bunks") },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    // Manual cascade delete (Convex doesn't have ON DELETE CASCADE)
    // 1. Delete accounts
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_bunk", (q) => q.eq("bunkId", args.id))
      .collect();
    
    for (const account of accounts) {
      await ctx.db.delete(account._id);
    }

    // 2. Delete vouchers
    const vouchers = await ctx.db
      .query("vouchers")
      .withIndex("by_bunk_and_date", (q) => q.eq("bunkId", args.id))
      .collect();
    
    for (const voucher of vouchers) {
      await ctx.db.delete(voucher._id);
    }

    // 3. Delete user_bunk_access
    const access = await ctx.db
      .query("userBunkAccess")
      .withIndex("by_bunk", (q) => q.eq("bunkId", args.id))
      .collect();
    
    for (const a of access) {
      await ctx.db.delete(a._id);
    }

    // 4. Finally delete the bunk
    await ctx.db.delete(args.id);

    return { success: true };
  },
});
```

### 4.2: Users Module

**File**: `convex/queries/users.ts`

```typescript
import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireSuperAdmin } from "../helpers/auth";

/**
 * Get all users (replaces GET /api/users)
 */
export const getAllUsers = query({
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);

    const users = await ctx.db.query("users").collect();

    // For each user, get their accessible bunks
    const usersWithBunks = await Promise.all(
      users.map(async (user) => {
        const access = await ctx.db
          .query("userBunkAccess")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();

        return {
          id: user._id,
          username: user.username,
          name: user.name,
          role: user.role,
          accessibleBunkIds: access.map((a) => a.bunkId),
          createdAt: user.createdAt,
        };
      })
    );

    return usersWithBunks;
  },
});

/**
 * Get user by ID (replaces GET /api/users/:id)
 */
export const getUserById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("User not found");

    const access = await ctx.db
      .query("userBunkAccess")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return {
      id: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
      accessibleBunkIds: access.map((a) => a.bunkId),
      createdAt: user.createdAt,
    };
  },
});
```

**File**: `convex/mutations/users.ts`

```typescript
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";
import { requireSuperAdmin } from "../helpers/auth";

/**
 * Create new user (replaces POST /api/users)
 */
export const createUser = mutation({
  args: {
    username: v.string(),
    password: v.string(),
    name: v.string(),
    role: v.union(v.literal("admin"), v.literal("super_admin")),
    accessibleBunkIds: v.array(v.id("bunks")),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    // Check unique username
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (existing) {
      throw new Error(`Username '${args.username}' already exists`);
    }

    // Validate
    if (!args.username.trim()) throw new Error("Username is required");
    if (!args.password || args.password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
    if (!args.name.trim()) throw new Error("Name is required");

    // Hash password
    const passwordHash = await bcrypt.hash(args.password, 10);

    // Create user
    const userId = await ctx.db.insert("users", {
      username: args.username.trim(),
      passwordHash,
      name: args.name.trim(),
      role: args.role,
      createdAt: Date.now(),
    });

    // Grant bunk access
    for (const bunkId of args.accessibleBunkIds) {
      await ctx.db.insert("userBunkAccess", {
        userId,
        bunkId,
      });
    }

    return await ctx.db.get(userId);
  },
});

/**
 * Update user (replaces PATCH /api/users/:id)
 */
export const updateUser = mutation({
  args: {
    id: v.id("users"),
    name: v.string(),
    role: v.union(v.literal("admin"), v.literal("super_admin")),
    accessibleBunkIds: v.array(v.id("bunks")),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    if (!args.name.trim()) throw new Error("Name is required");

    // Update user fields
    const updateData: any = {
      name: args.name.trim(),
      role: args.role,
    };

    // Update password if provided
    if (args.password) {
      if (args.password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }
      updateData.passwordHash = await bcrypt.hash(args.password, 10);
    }

    await ctx.db.patch(args.id, updateData);

    // Update bunk access (delete old, insert new)
    const oldAccess = await ctx.db
      .query("userBunkAccess")
      .withIndex("by_user", (q) => q.eq("userId", args.id))
      .collect();

    for (const access of oldAccess) {
      await ctx.db.delete(access._id);
    }

    for (const bunkId of args.accessibleBunkIds) {
      await ctx.db.insert("userBunkAccess", {
        userId: args.id,
        bunkId,
      });
    }

    return await ctx.db.get(args.id);
  },
});

/**
 * Delete user (replaces DELETE /api/users/:id)
 */
export const deleteUser = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    // Delete user_bunk_access
    const access = await ctx.db
      .query("userBunkAccess")
      .withIndex("by_user", (q) => q.eq("userId", args.id))
      .collect();

    for (const a of access) {
      await ctx.db.delete(a._id);
    }

    // Delete user
    await ctx.db.delete(args.id);

    return { success: true };
  },
});
```

### 4.3: Accounts Module

**File**: `convex/queries/accounts.ts`

```typescript
import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, checkBunkAccess } from "../helpers/auth";

/**
 * Get all accounts for a bunk (replaces GET /api/accounts?bunkId=xxx)
 */
export const getAccountsByBunk = query({
  args: { bunkId: v.id("bunks") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    await checkBunkAccess(ctx, args.bunkId);

    return await ctx.db
      .query("accounts")
      .withIndex("by_bunk", (q) => q.eq("bunkId", args.bunkId))
      .collect();
  },
});

/**
 * Get account by ID (replaces GET /api/accounts/:id)
 */
export const getAccountById = query({
  args: { id: v.id("accounts") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    const account = await ctx.db.get(args.id);
    if (!account) throw new Error("Account not found");

    await checkBunkAccess(ctx, account.bunkId);
    return account;
  },
});

/**
 * Get account hierarchy (recursive)
 * Replaces PostgreSQL WITH RECURSIVE query
 */
export const getAccountHierarchy = query({
  args: { bunkId: v.id("bunks") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    await checkBunkAccess(ctx, args.bunkId);

    // Get all accounts for the bunk
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_bunk", (q) => q.eq("bunkId", args.bunkId))
      .collect();

    // Build hierarchy recursively
    const accountMap = new Map(accounts.map((a) => [a._id, { ...a, children: [] }]));

    const roots: any[] = [];

    for (const account of accounts) {
      const node = accountMap.get(account._id)!;
      
      if (account.parentId) {
        const parent = accountMap.get(account.parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    return roots;
  },
});
```

**File**: `convex/mutations/accounts.ts`

```typescript
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, checkBunkAccess } from "../helpers/auth";

/**
 * Create account (replaces POST /api/accounts)
 */
export const createAccount = mutation({
  args: {
    name: v.string(),
    parentId: v.optional(v.id("accounts")),
    openingDebit: v.number(),
    openingCredit: v.number(),
    bunkId: v.id("bunks"),
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    await checkBunkAccess(ctx, args.bunkId);

    // Validate
    if (!args.name.trim()) throw new Error("Name is required");
    if (args.openingDebit < 0) throw new Error("Opening debit cannot be negative");
    if (args.openingCredit < 0) throw new Error("Opening credit cannot be negative");

    // If parentId provided, verify it exists and belongs to same bunk
    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (!parent) throw new Error("Parent account not found");
      if (parent.bunkId !== args.bunkId) {
        throw new Error("Parent account must belong to the same bunk");
      }
    }

    // Insert
    const accountId = await ctx.db.insert("accounts", {
      name: args.name.trim(),
      parentId: args.parentId,
      openingDebit: args.openingDebit,
      openingCredit: args.openingCredit,
      bunkId: args.bunkId,
      createdAt: Date.now(),
    });

    return await ctx.db.get(accountId);
  },
});

/**
 * Update account (replaces PATCH /api/accounts/:id)
 */
export const updateAccount = mutation({
  args: {
    id: v.id("accounts"),
    name: v.string(),
    openingDebit: v.number(),
    openingCredit: v.number(),
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    const account = await ctx.db.get(args.id);
    if (!account) throw new Error("Account not found");

    await checkBunkAccess(ctx, account.bunkId);

    if (!args.name.trim()) throw new Error("Name is required");
    if (args.openingDebit < 0) throw new Error("Opening debit cannot be negative");
    if (args.openingCredit < 0) throw new Error("Opening credit cannot be negative");

    await ctx.db.patch(args.id, {
      name: args.name.trim(),
      openingDebit: args.openingDebit,
      openingCredit: args.openingCredit,
    });

    return await ctx.db.get(args.id);
  },
});

/**
 * Delete account (replaces DELETE /api/accounts/:id)
 */
export const deleteAccount = mutation({
  args: { id: v.id("accounts") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    const account = await ctx.db.get(args.id);
    if (!account) throw new Error("Account not found");

    await checkBunkAccess(ctx, account.bunkId);

    // Check if account has children
    const children = await ctx.db
      .query("accounts")
      .withIndex("by_parent", (q) => q.eq("parentId", args.id))
      .collect();

    if (children.length > 0) {
      throw new Error("Cannot delete account with child accounts");
    }

    // Check if account has vouchers
    const vouchers = await ctx.db
      .query("vouchers")
      .withIndex("by_account", (q) => q.eq("accountId", args.id))
      .first();

    if (vouchers) {
      throw new Error("Cannot delete account with existing vouchers");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});
```

### 4.4: Vouchers Module

**File**: `convex/queries/vouchers.ts`

```typescript
import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, checkBunkAccess } from "../helpers/auth";

/**
 * Get vouchers by bunk and date range
 * (replaces GET /api/vouchers?bunkId=xxx&startDate=xxx&endDate=xxx)
 */
export const getVouchersByBunkAndDateRange = query({
  args: {
    bunkId: v.id("bunks"),
    startDate: v.string(),  // 'YYYY-MM-DD'
    endDate: v.string(),    // 'YYYY-MM-DD'
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    await checkBunkAccess(ctx, args.bunkId);

    // Query vouchers in date range
    const vouchers = await ctx.db
      .query("vouchers")
      .withIndex("by_bunk_and_date", (q) =>
        q.eq("bunkId", args.bunkId)
          .gte("txnDate", args.startDate)
          .lte("txnDate", args.endDate)
      )
      .collect();

    return vouchers;
  },
});

/**
 * Get vouchers by account (for ledger report)
 * (replaces GET /api/vouchers?accountId=xxx)
 */
export const getVouchersByAccount = query({
  args: {
    accountId: v.id("accounts"),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    const account = await ctx.db.get(args.accountId);
    if (!account) throw new Error("Account not found");

    await checkBunkAccess(ctx, account.bunkId);

    let voucherQuery = ctx.db
      .query("vouchers")
      .withIndex("by_account", (q) => q.eq("accountId", args.accountId));

    const vouchers = await voucherQuery.collect();

    // Filter by date if provided (Convex doesn't support compound filters in indexes)
    let filtered = vouchers;
    if (args.startDate) {
      filtered = filtered.filter((v) => v.txnDate >= args.startDate!);
    }
    if (args.endDate) {
      filtered = filtered.filter((v) => v.txnDate <= args.endDate!);
    }

    return filtered;
  },
});
```

**File**: `convex/mutations/vouchers.ts`

```typescript
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, checkBunkAccess } from "../helpers/auth";

/**
 * Create voucher (replaces POST /api/vouchers)
 */
export const createVoucher = mutation({
  args: {
    txnDate: v.string(),  // 'YYYY-MM-DD'
    accountId: v.id("accounts"),
    debit: v.number(),
    credit: v.number(),
    description: v.string(),
    bunkId: v.id("bunks"),
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    await checkBunkAccess(ctx, args.bunkId);

    // Validate business rule: must have either debit OR credit > 0
    if (args.debit === 0 && args.credit === 0) {
      throw new Error("Voucher must have either debit or credit amount");
    }

    if (args.debit < 0) throw new Error("Debit cannot be negative");
    if (args.credit < 0) throw new Error("Credit cannot be negative");

    // Verify account exists and belongs to same bunk
    const account = await ctx.db.get(args.accountId);
    if (!account) throw new Error("Account not found");
    if (account.bunkId !== args.bunkId) {
      throw new Error("Account must belong to the same bunk");
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.txnDate)) {
      throw new Error("Invalid date format. Use YYYY-MM-DD");
    }

    // Insert voucher
    const voucherId = await ctx.db.insert("vouchers", {
      txnDate: args.txnDate,
      accountId: args.accountId,
      debit: args.debit,
      credit: args.credit,
      description: args.description.trim(),
      bunkId: args.bunkId,
      createdAt: Date.now(),
    });

    return await ctx.db.get(voucherId);
  },
});

/**
 * Update voucher (replaces PATCH /api/vouchers/:id)
 */
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
    await getCurrentUser(ctx);

    const voucher = await ctx.db.get(args.id);
    if (!voucher) throw new Error("Voucher not found");

    await checkBunkAccess(ctx, voucher.bunkId);

    // Validate
    if (args.debit === 0 && args.credit === 0) {
      throw new Error("Voucher must have either debit or credit amount");
    }
    if (args.debit < 0) throw new Error("Debit cannot be negative");
    if (args.credit < 0) throw new Error("Credit cannot be negative");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.txnDate)) {
      throw new Error("Invalid date format. Use YYYY-MM-DD");
    }

    // Verify new account exists and belongs to same bunk
    const account = await ctx.db.get(args.accountId);
    if (!account) throw new Error("Account not found");
    if (account.bunkId !== voucher.bunkId) {
      throw new Error("Account must belong to the same bunk");
    }

    await ctx.db.patch(args.id, {
      txnDate: args.txnDate,
      accountId: args.accountId,
      debit: args.debit,
      credit: args.credit,
      description: args.description.trim(),
    });

    return await ctx.db.get(args.id);
  },
});

/**
 * Delete voucher (replaces DELETE /api/vouchers/:id)
 */
export const deleteVoucher = mutation({
  args: { id: v.id("vouchers") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    const voucher = await ctx.db.get(args.id);
    if (!voucher) throw new Error("Voucher not found");

    await checkBunkAccess(ctx, voucher.bunkId);

    await ctx.db.delete(args.id);
    return { success: true };
  },
});
```

### 4.5: Reminders Module

**File**: `convex/queries/reminders.ts`

```typescript
import { query } from "../_generated/server";
import { getCurrentUser } from "../helpers/auth";

/**
 * Get all reminders (replaces GET /api/reminders)
 */
export const getAllReminders = query({
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    return await ctx.db.query("reminders").order("asc", "dueDate").collect();
  },
});

/**
 * Get upcoming reminders (within next 7 days)
 */
export const getUpcomingReminders = query({
  handler: async (ctx) => {
    await getCurrentUser(ctx);

    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const reminders = await ctx.db
      .query("reminders")
      .withIndex("by_reminder_date", (q) =>
        q.gte("reminderDate", today).lte("reminderDate", nextWeek)
      )
      .collect();

    return reminders;
  },
});
```

**File**: `convex/mutations/reminders.ts`

```typescript
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../helpers/auth";

/**
 * Create reminder (replaces POST /api/reminders)
 */
export const createReminder = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    reminderDate: v.string(),  // 'YYYY-MM-DD'
    dueDate: v.string(),       // 'YYYY-MM-DD'
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    // Validate
    if (!args.title.trim()) throw new Error("Title is required");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.reminderDate)) {
      throw new Error("Invalid reminder date format. Use YYYY-MM-DD");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.dueDate)) {
      throw new Error("Invalid due date format. Use YYYY-MM-DD");
    }

    // Insert
    const reminderId = await ctx.db.insert("reminders", {
      title: args.title.trim(),
      description: args.description.trim(),
      reminderDate: args.reminderDate,
      dueDate: args.dueDate,
      createdBy: user.username,
      createdAt: Date.now(),
    });

    return await ctx.db.get(reminderId);
  },
});

/**
 * Update reminder (replaces PATCH /api/reminders/:id)
 */
export const updateReminder = mutation({
  args: {
    id: v.id("reminders"),
    title: v.string(),
    description: v.string(),
    reminderDate: v.string(),
    dueDate: v.string(),
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    if (!args.title.trim()) throw new Error("Title is required");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.reminderDate)) {
      throw new Error("Invalid reminder date format. Use YYYY-MM-DD");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.dueDate)) {
      throw new Error("Invalid due date format. Use YYYY-MM-DD");
    }

    await ctx.db.patch(args.id, {
      title: args.title.trim(),
      description: args.description.trim(),
      reminderDate: args.reminderDate,
      dueDate: args.dueDate,
    });

    return await ctx.db.get(args.id);
  },
});

/**
 * Delete reminder (replaces DELETE /api/reminders/:id)
 */
export const deleteReminder = mutation({
  args: { id: v.id("reminders") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
```

---

## Phase 5: Frontend Integration

### Step 5.1: Update API Client

**File**: `apps/frontend/src/convex-api.ts` (NEW - replaces `api.ts`)

```typescript
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

/**
 * Convex API hooks (replaces REST fetch calls)
 */

// ─────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────
export const useLogin = () => useMutation(api.mutations.auth.login);
export const useLogout = () => useMutation(api.mutations.auth.logout);
export const useCurrentUser = () => useQuery(api.mutations.auth.getCurrentUser);

// ─────────────────────────────────────────────────────
// BUNKS
// ─────────────────────────────────────────────────────
export const useBunks = () => useQuery(api.queries.bunks.getAllBunks);
export const useBunkById = (id: Id<"bunks"> | null) => 
  useQuery(api.queries.bunks.getBunkById, id ? { id } : "skip");
export const useCreateBunk = () => useMutation(api.mutations.bunks.createBunk);
export const useUpdateBunk = () => useMutation(api.mutations.bunks.updateBunk);
export const useDeleteBunk = () => useMutation(api.mutations.bunks.deleteBunk);

// ─────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────
export const useUsers = () => useQuery(api.queries.users.getAllUsers);
export const useUserById = (id: Id<"users"> | null) =>
  useQuery(api.queries.users.getUserById, id ? { id } : "skip");
export const useCreateUser = () => useMutation(api.mutations.users.createUser);
export const useUpdateUser = () => useMutation(api.mutations.users.updateUser);
export const useDeleteUser = () => useMutation(api.mutations.users.deleteUser);

// ─────────────────────────────────────────────────────
// ACCOUNTS
// ─────────────────────────────────────────────────────
export const useAccountsByBunk = (bunkId: Id<"bunks"> | null) =>
  useQuery(api.queries.accounts.getAccountsByBunk, bunkId ? { bunkId } : "skip");
export const useAccountHierarchy = (bunkId: Id<"bunks"> | null) =>
  useQuery(api.queries.accounts.getAccountHierarchy, bunkId ? { bunkId } : "skip");
export const useCreateAccount = () => useMutation(api.mutations.accounts.createAccount);
export const useUpdateAccount = () => useMutation(api.mutations.accounts.updateAccount);
export const useDeleteAccount = () => useMutation(api.mutations.accounts.deleteAccount);

// ─────────────────────────────────────────────────────
// VOUCHERS
// ─────────────────────────────────────────────────────
export const useVouchersByBunkAndDateRange = (
  bunkId: Id<"bunks"> | null,
  startDate: string,
  endDate: string
) =>
  useQuery(
    api.queries.vouchers.getVouchersByBunkAndDateRange,
    bunkId ? { bunkId, startDate, endDate } : "skip"
  );
export const useVouchersByAccount = (
  accountId: Id<"accounts"> | null,
  startDate?: string,
  endDate?: string
) =>
  useQuery(
    api.queries.vouchers.getVouchersByAccount,
    accountId ? { accountId, startDate, endDate } : "skip"
  );
export const useCreateVoucher = () => useMutation(api.mutations.vouchers.createVoucher);
export const useUpdateVoucher = () => useMutation(api.mutations.vouchers.updateVoucher);
export const useDeleteVoucher = () => useMutation(api.mutations.vouchers.deleteVoucher);

// ─────────────────────────────────────────────────────
// REMINDERS
// ─────────────────────────────────────────────────────
export const useReminders = () => useQuery(api.queries.reminders.getAllReminders);
export const useUpcomingReminders = () => useQuery(api.queries.reminders.getUpcomingReminders);
export const useCreateReminder = () => useMutation(api.mutations.reminders.createReminder);
export const useUpdateReminder = () => useMutation(api.mutations.reminders.updateReminder);
export const useDeleteReminder = () => useMutation(api.mutations.reminders.deleteReminder);
```

### Step 5.2: Update Login Page

**File**: `apps/frontend/pages/Login.tsx` (example update)

```typescript
// BEFORE (REST API)
const handleLogin = async () => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  const user = await response.json();
  // ...
};

// AFTER (Convex)
import { useLogin } from '../convex-api';

const Login = () => {
  const login = useLogin();
  
  const handleLogin = async () => {
    try {
      const user = await login({ username, password });
      // Convex automatically handles session
      // ...
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  // ... rest of component
};
```

### Step 5.3: Real-time Data Subscriptions

One of Convex's killer features is automatic real-time updates:

```typescript
// Component automatically re-renders when data changes!
const Dashboard = () => {
  const bunks = useBunks();  // ← Subscribes to real-time updates
  const reminders = useUpcomingReminders();  // ← Also real-time
  
  // No need for polling, no need for manual refresh
  // Data stays in sync across all connected clients
  
  return (
    <div>
      <h1>Bunks ({bunks?.length})</h1>
      {bunks?.map(bunk => (
        <div key={bunk._id}>{bunk.name}</div>
      ))}
    </div>
  );
};
```

---

## Phase 6: Data Migration

### Step 6.1: Export PostgreSQL Data

```bash
# Export data from PostgreSQL
pg_dump -U postgres -d kr_fuels --data-only --inserts -f data_export.sql

# Or export as CSV
psql -U postgres -d kr_fuels -c "\COPY bunks TO 'bunks.csv' CSV HEADER"
psql -U postgres -d kr_fuels -c "\COPY users TO 'users.csv' CSV HEADER"
psql -U postgres -d kr_fuels -c "\COPY accounts TO 'accounts.csv' CSV HEADER"
psql -U postgres -d kr_fuels -c "\COPY vouchers TO 'vouchers.csv' CSV HEADER"
psql -U postgres -d kr_fuels -c "\COPY reminders TO 'reminders.csv' CSV HEADER"
psql -U postgres -d kr_fuels -c "\COPY user_bunk_access TO 'user_bunk_access.csv' CSV HEADER"
```

### Step 6.2: Create Migration Script

**File**: `convex/migrations/importData.ts`

```typescript
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";

/**
 * Import data from PostgreSQL export
 * Run with: npx convex run migrations/importData:importAll
 */

export const importBunks = mutation({
  args: {
    bunks: v.array(
      v.object({
        id: v.string(),  // PostgreSQL UUID
        name: v.string(),
        code: v.string(),
        location: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const idMap = new Map<string, string>();  // Old UUID → New Convex ID

    for (const bunk of args.bunks) {
      const newId = await ctx.db.insert("bunks", {
        name: bunk.name,
        code: bunk.code,
        location: bunk.location,
        createdAt: Date.now(),
      });
      idMap.set(bunk.id, newId);
    }

    return { imported: args.bunks.length, idMap: Object.fromEntries(idMap) };
  },
});

export const importUsers = mutation({
  args: {
    users: v.array(
      v.object({
        id: v.string(),
        username: v.string(),
        passwordHash: v.string(),
        name: v.string(),
        role: v.union(v.literal("admin"), v.literal("super_admin")),
      })
    ),
  },
  handler: async (ctx, args) => {
    const idMap = new Map<string, string>();

    for (const user of args.users) {
      const newId = await ctx.db.insert("users", {
        username: user.username,
        passwordHash: user.passwordHash,
        name: user.name,
        role: user.role,
        createdAt: Date.now(),
      });
      idMap.set(user.id, newId);
    }

    return { imported: args.users.length, idMap: Object.fromEntries(idMap) };
  },
});

// Similar for accounts, vouchers, reminders, user_bunk_access
// ...
```

### Step 6.3: Run Migration

```bash
# 1. Prepare data as JSON (convert CSV/SQL to JSON)
# 2. Run migration
npx convex run migrations/importData:importBunks --args '{"bunks": [...]}'
npx convex run migrations/importData:importUsers --args '{"users": [...]}'
# ... etc
```

---

## Phase 7: Testing & Validation

### Step 7.1: Test Checklist

- [ ] **Authentication**
  - [ ] Login with correct credentials
  - [ ] Login fails with wrong password
  - [ ] Session persists on page reload
  - [ ] Logout clears session

- [ ] **Bunks Module**
  - [ ] List all bunks
  - [ ] Create new bunk (super_admin only)
  - [ ] Update bunk details
  - [ ] Delete bunk (with cascade)
  - [ ] Non-super_admin cannot create/delete

- [ ] **Users Module**
  - [ ] List all users
  - [ ] Create user with bunk access
  - [ ] Update user role and bunks
  - [ ] Delete user
  - [ ] Password hashing works

- [ ] **Accounts Module**
  - [ ] List accounts by bunk
  - [ ] Create root account
  - [ ] Create child account (hierarchy)
  - [ ] Update account
  - [ ] Delete account (prevent if has children)
  - [ ] Hierarchy traversal works

- [ ] **Vouchers Module**
  - [ ] Create voucher (debit/credit validation)
  - [ ] List vouchers by date range
  - [ ] Update voucher
  - [ ] Delete voucher
  - [ ] Ledger report calculates correctly

- [ ] **Reminders Module**
  - [ ] Create reminder
  - [ ] List upcoming reminders
  - [ ] Update reminder
  - [ ] Delete reminder

- [ ] **Real-time Features**
  - [ ] Open app in two browsers
  - [ ] Create voucher in one → updates in other
  - [ ] Test latency and sync

### Step 7.2: Performance Testing

```typescript
// Test large dataset queries
// Convex automatically optimizes, but verify:
// 1. Date range queries are fast
// 2. Hierarchy traversal is efficient
// 3. No N+1 query problems
```

---

## Phase 8: Deployment

### Step 8.1: Deploy to Convex Cloud

```bash
# Deploy backend
npx convex deploy

# Get production URL
# Update frontend .env with production Convex URL

# Deploy frontend (example with Vercel)
cd apps/frontend
npm run build
vercel --prod
```

### Step 8.2: Environment Variables

**Production `.env`**:

```env
VITE_CONVEX_URL=https://your-production-deployment.convex.cloud
```

### Step 8.3: Parallel Deployment Strategy (Zero Downtime)

```
┌─────────────────┐
│  Old Frontend   │────┐
│  (REST API)     │    │
└─────────────────┘    │
                       ▼
                 ┌─────────────┐
                 │   NestJS    │
                 │   Backend   │
                 └─────────────┘
                       │
                       ▼
                 ┌─────────────┐
                 │ PostgreSQL  │
                 └─────────────┘

              (Parallel Period)

┌─────────────────┐
│  New Frontend   │────┐
│  (Convex API)   │    │
└─────────────────┘    │
                       ▼
                 ┌─────────────┐
                 │   Convex    │
                 │  Platform   │
                 └─────────────┘
```

**Migration Steps**:

1. **Week 1**: Deploy Convex backend, keep NestJS running
2. **Week 2**: Migrate data to Convex, test thoroughly
3. **Week 3**: Deploy new frontend to staging, test with real users
4. **Week 4**: Switch production traffic to Convex, keep NestJS as backup
5. **Week 5+**: Monitor, fix issues, decommission NestJS

---

## Rollback Strategy

### If Migration Fails

**Immediate Rollback**:

1. Switch DNS/routing back to old NestJS backend
2. Revert frontend deployment to previous version
3. Keep PostgreSQL data intact

**Convex Data Export** (backup strategy):

```bash
# Export all data from Convex
npx convex export --output convex-backup.zip

# Re-import to PostgreSQL if needed
# (Use custom script to convert Convex IDs → UUIDs)
```

### Backup Checklist

- [ ] PostgreSQL backup before migration: `pg_dump`
- [ ] Convex deployment snapshots (automatic)
- [ ] Frontend deployment rollback (Vercel/Netlify keep history)
- [ ] Test rollback procedure in staging

---

## Cost Analysis

### Current Stack (NestJS + PostgreSQL)

**Monthly Costs**:

- Backend hosting (AWS/Heroku): $25-50/month
- PostgreSQL database (managed): $15-30/month
- SSL certificates: $0-10/month
- Monitoring/logging: $10-20/month

**Total**: ~$50-110/month

**Hidden Costs**:

- DevOps time (deployment, scaling, monitoring)
- Database maintenance (backups, migrations)
- Security patches

### Convex Platform

**Free Tier** (sufficient for small-medium app):

- 100K monthly active users
- 1GB storage
- 1M function calls/month
- Unlimited team members
- **Cost**: $0/month

**Paid Tier** (if you exceed free tier):

- $25/month base
- Additional usage-based pricing

**Total Savings**: ~$25-85/month + reduced DevOps time

---

## Appendix

### A. Convex vs NestJS Quick Reference

| NestJS Concept | Convex Equivalent | Example |
|---|---|---|
| `@Controller()` | `export const functionName = query/mutation` | `export const getUsers = query(...)` |
| `@Get('/users')` | `api.queries.users.getUsers` | Called from frontend with `useQuery` |
| `@Post('/users')` | `api.mutations.users.createUser` | Called with `useMutation` |
| `@UseGuards(JwtAuthGuard)` | `await getCurrentUser(ctx)` | Built into function handler |
| `@Inject(UsersService)` | Direct function calls | No DI needed |
| TypeORM `find()` | `ctx.db.query().collect()` | More type-safe |
| TypeORM `save()` | `ctx.db.insert()` | Returns ID immediately |
| DTO validation | Convex `args` validation | `args: { name: v.string() }` |

### B. Common Pitfalls

1. **Forgetting Auth Checks**: Always call `getCurrentUser()` at start of handlers
2. **UUID Migration**: Map old UUIDs → new Convex IDs during data import
3. **Cascade Deletes**: Manually delete related records (Convex has no ON DELETE CASCADE)
4. **Date Formats**: Store dates as strings ('YYYY-MM-DD') for easy filtering
5. **Unique Constraints**: Enforce in mutation logic, not schema
6. **Transactions**: Convex mutations are atomic, but plan multi-step carefully

### C. Helpful Resources

- **Convex Docs**: https://docs.convex.dev
- **Convex Discord**: https://convex.dev/community
- **Migration Examples**: https://docs.convex.dev/database/migrations
- **TypeScript API**: https://docs.convex.dev/api

### D. Incremental Migration Checklist

- [ ] Phase 1: Convex setup (1-2 days)
- [ ] Phase 2: Schema migration (2-3 days)
- [ ] Phase 3: Auth migration (2-3 days)
- [ ] Phase 4: Business logic migration (5-7 days)
  - [ ] Bunks module
  - [ ] Users module
  - [ ] Accounts module
  - [ ] Vouchers module
  - [ ] Reminders module
- [ ] Phase 5: Frontend integration (3-5 days)
- [ ] Phase 6: Data migration (1-2 days)
- [ ] Phase 7: Testing (3-5 days)
- [ ] Phase 8: Deployment (1-2 days)

**Total**: 18-29 days (adjust based on team size)

### E. Success Metrics

**Track These Post-Migration**:

- Query latency (should be <100ms)
- Real-time sync latency
- Function execution time
- Error rates
- User satisfaction (especially for real-time features)
- Development velocity (faster to add features?)

### F. When to Migrate Each Module

**Suggested Order** (low-risk → high-risk):

1. **Reminders** (standalone, no complex relationships)
2. **Bunks** (simple CRUD, few dependencies)
3. **Users** (needed for auth, but well-defined)
4. **Accounts** (hierarchical, more complex)
5. **Vouchers** (depends on accounts, most critical)

Migrate one module at a time, test thoroughly before moving to next.

---

## Conclusion

Migrating KR-FUELS from NestJS + PostgreSQL to Convex is a **medium-effort, high-reward** decision:

**Pros**:
- ✅ Simplified architecture (no backend server to manage)
- ✅ Real-time data sync (huge UX improvement)
- ✅ Type-safe end-to-end
- ✅ Faster development velocity
- ✅ Lower hosting costs
- ✅ Better developer experience

**Cons**:
- ⚠️ Vendor lock-in to Convex
- ⚠️ Learning curve for team
- ⚠️ Migration effort (~3-4 weeks)
- ⚠️ Need to rewrite recursive queries (account hierarchy)

**Recommendation**:

If your team values **rapid development**, **real-time features**, and **reduced DevOps overhead**, **migrate to Convex**.

If you have **complex SQL requirements**, **large existing dataset**, or **team strongly prefers SQL**, **stay with PostgreSQL**.

For KR-FUELS (small-medium accounting app, 8 bunks, hierarchical accounts), **Convex is a great fit**.

---

**Next Steps**:

1. Review this guide with your team
2. Set up Convex account and test locally
3. Migrate one module (e.g., Reminders) as proof-of-concept
4. Decide: full migration or stay with NestJS

**Questions?** Open an issue or contact: [your-email@example.com]

---

*Last Updated*: February 27, 2026  
*Document Version*: 1.0  
*Author*: KR-FUELS Development Team