import { QueryCtx, MutationCtx } from "../_generated/server";

/**
 * Authentication Helper Functions
 * Note: For Reminders PoC, we'll skip authentication checks
 * Full auth will be implemented when migrating the Users module
 */

/**
 * Get current authenticated user from context
 * TODO: Implement when migrating auth to Convex
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  // For PoC: Skip authentication, return mock user
  // In production, this will query the users table
  return {
    _id: "mock-user-id" as any,
    username: "admin",
    name: "Admin User",
    role: "super_admin" as const,
    createdAt: Date.now(),
  };
}

/**
 * Check if user has super_admin role
 * TODO: Implement when migrating auth to Convex
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
 * TODO: Implement when migrating auth to Convex
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

  // For PoC: Allow all access
  // In production, this will check userBunkAccess table
  return true;
}
