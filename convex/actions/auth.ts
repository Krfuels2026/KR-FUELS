"use node";
// @ts-nocheck

import { action } from "../_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { api } from "../_generated/api";

// Security Configuration
const JWT_EXPIRY = "24h";
const JWT_ALGORITHM = "HS256";
const RATE_LIMIT_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const LOCKOUT_THRESHOLD = 5;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable not set");
  return secret;
}

function validatePasswordComplexity(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) return { valid: false, message: "Password must be at least 8 characters" };
  if (!/[A-Z]/.test(password)) return { valid: false, message: "Password must contain at least one uppercase letter" };
  if (!/\d/.test(password)) return { valid: false, message: "Password must contain at least one number" };
  return { valid: true };
}

// Login with rate limiting and account lockout
export const login = action({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedUsername = args.username.toLowerCase().trim();

    const lockStatus = await ctx.runQuery(api.queries.loginAttempts.isAccountLocked, {
      username: normalizedUsername,
    });
    if (lockStatus.locked) {
      throw new Error(`Account locked. Try again after ${lockStatus.unlockTime}`);
    }

    const recentAttempts = await ctx.runQuery(api.queries.loginAttempts.getRecentFailedAttempts, {
      username: normalizedUsername,
    });
    const oneMinuteAgo = Date.now() - RATE_LIMIT_WINDOW_MS;
    const attemptsInLastMinute = recentAttempts.filter((a: any) => a.timestamp > oneMinuteAgo);
    if (attemptsInLastMinute.length >= RATE_LIMIT_ATTEMPTS) {
      throw new Error("Too many login attempts. Please wait 1 minute.");
    }

    const user = await ctx.runQuery(api.queries.users.getUserByUsername, {
      username: args.username,
    });

    if (!user) {
      await ctx.runMutation(api.mutations.loginAttempts.recordAttempt, {
        username: normalizedUsername,
        success: false,
      });
      throw new Error("Invalid username or password");
    }

    const validPassword = await bcrypt.compare(args.password, user.passwordHash);
    if (!validPassword) {
      await ctx.runMutation(api.mutations.loginAttempts.recordAttempt, {
        username: normalizedUsername,
        success: false,
      });
      throw new Error("Invalid username or password");
    }

    await ctx.runMutation(api.mutations.loginAttempts.recordAttempt, {
      username: normalizedUsername,
      success: true,
    });

    const accessibleBunks = await ctx.runQuery(api.queries.users.getUserBunks, {
      userId: user._id,
    });
    const accessibleBunkIds = accessibleBunks.map((ab: any) => ab.bunkId);

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      getJwtSecret(),
      { algorithm: JWT_ALGORITHM, expiresIn: JWT_EXPIRY }
    );

    return {
      id: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
      accessibleBunkIds,
      token,
      expiresIn: JWT_EXPIRY,
    };
  },
});

// Register new user with password complexity enforcement
export const registerUser = action({
  args: {
    username: v.string(),
    password: v.string(),
    name: v.string(),
    role: v.union(v.literal("admin"), v.literal("super_admin")),
    accessibleBunkIds: v.array(v.id("bunks")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.runQuery(api.queries.users.getUserByUsername, {
      username: args.username,
    });
    if (existing) throw new Error("Username already exists");

    const passwordCheck = validatePasswordComplexity(args.password);
    if (!passwordCheck.valid) throw new Error(passwordCheck.message);

    const passwordHash = await bcrypt.hash(args.password, 10);

    const userId = await ctx.runMutation(api.mutations.users.createUser, {
      username: args.username.trim(),
      passwordHash,
      name: args.name.trim(),
      role: args.role,
      accessibleBunkIds: args.accessibleBunkIds,
    });

    return { id: userId, username: args.username, name: args.name, role: args.role };
  },
});

// Change password with complexity validation
export const changePassword = action({
  args: {
    userId: v.id("users"),
    oldPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(api.queries.users.getUserById, {
      userId: args.userId,
    });
    if (!user) throw new Error("User not found");

    const validPassword = await bcrypt.compare(args.oldPassword, user.passwordHash);
    if (!validPassword) throw new Error("Current password is incorrect");

    const passwordCheck = validatePasswordComplexity(args.newPassword);
    if (!passwordCheck.valid) throw new Error(passwordCheck.message);

    const newPasswordHash = await bcrypt.hash(args.newPassword, 10);
    await ctx.runMutation(api.mutations.users.updatePassword, {
      userId: args.userId,
      newPasswordHash,
    });

    return { success: true };
  },
});

// Verify JWT token (algorithm locked to HS256)
export const verifyToken = action({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    try {
      const decoded = jwt.verify(args.token, getJwtSecret(), {
        algorithms: [JWT_ALGORITHM],
      }) as { userId: string; username: string; role: string; iat: number; exp: number };

      const user = await ctx.runQuery(api.queries.users.getUserByUsername, {
        username: decoded.username,
      });
      if (!user) return { valid: false, error: "User not found", expired: false };

      const accessibleBunks = await ctx.runQuery(api.queries.users.getUserBunks, {
        userId: user._id,
      });
      const accessibleBunkIds = accessibleBunks.map((ab: any) => ab.bunkId);

      return {
        valid: true,
        user: { id: user._id, username: user.username, name: user.name, role: user.role, accessibleBunkIds },
        expiresAt: new Date(decoded.exp * 1000).toISOString(),
      };
    } catch (error: any) {
      if (error.name === "TokenExpiredError") return { valid: false, error: "Token expired", expired: true };
      return { valid: false, error: "Invalid token", expired: false };
    }
  },
});

// Refresh token (re-verifies user exists)
export const refreshToken = action({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    try {
      const decoded = jwt.verify(args.token, getJwtSecret(), {
        algorithms: [JWT_ALGORITHM],
      }) as { userId: string; username: string; role: string };

      const user = await ctx.runQuery(api.queries.users.getUserByUsername, {
        username: decoded.username,
      });
      if (!user) throw new Error("User no longer exists");

      const newToken = jwt.sign(
        { userId: user._id, username: user.username, role: user.role },
        getJwtSecret(),
        { algorithm: JWT_ALGORITHM, expiresIn: JWT_EXPIRY }
      );

      return { success: true, token: newToken, expiresIn: JWT_EXPIRY };
    } catch (error: any) {
      throw new Error("Cannot refresh - token invalid or expired");
    }
  },
});
