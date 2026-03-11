import { query } from "../_generated/server";
import { v } from "convex/values";

// Get failed attempts in last 15 minutes (for rate limiting)
export const getRecentFailedAttempts = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    const normalizedUsername = args.username.toLowerCase().trim();
    
    return await ctx.db
      .query("loginAttempts")
      .withIndex("by_username", (q) => q.eq("username", normalizedUsername))
      .filter((q) => 
        q.and(
          q.eq(q.field("success"), false),
          q.gt(q.field("timestamp"), fifteenMinutesAgo)
        )
      )
      .collect();
  },
});

// Count consecutive failures since last success
export const getConsecutiveFailedAttempts = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const normalizedUsername = args.username.toLowerCase().trim();
    
    const attempts = await ctx.db
      .query("loginAttempts")
      .withIndex("by_username", (q) => q.eq("username", normalizedUsername))
      .order("desc")
      .collect();
    
    let consecutiveFailures = 0;
    for (const attempt of attempts) {
      if (attempt.success) break;
      consecutiveFailures++;
    }
    
    return consecutiveFailures;
  },
});

// Check if account is locked (5+ consecutive failures in last hour)
export const isAccountLocked = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const normalizedUsername = args.username.toLowerCase().trim();
    
    const recentAttempts = await ctx.db
      .query("loginAttempts")
      .withIndex("by_username", (q) => q.eq("username", normalizedUsername))
      .filter((q) => q.gt(q.field("timestamp"), oneHourAgo))
      .order("desc")
      .collect();
    
    let consecutiveFailures = 0;
    for (const attempt of recentAttempts) {
      if (attempt.success) break;
      consecutiveFailures++;
    }
    
    const isLocked = consecutiveFailures >= 5;
    let unlockTime: string | null = null;
    if (isLocked && recentAttempts.length > 0) {
      unlockTime = new Date(recentAttempts[0].timestamp + 60 * 60 * 1000).toISOString();
    }
    
    return { locked: isLocked, consecutiveFailures, unlockTime };
  },
});
