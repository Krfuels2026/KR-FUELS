"use node";
// @ts-nocheck

import { action } from "../_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { api } from "../_generated/api";

/**
 * Authentication Actions with JWT
 * Uses Node.js runtime for bcrypt password hashing and JWT token generation
 * Token expiry: 24 hours
 */

const JWT_EXPIRY = "24h"; // Token expires in 24 hours

// Helper to get JWT secret from environment
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable not set");
  }
  return secret;
}

/**
 * Login with username and password
 * Returns user data if credentials are valid
 */
export const login = action({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by username
    const user = await ctx.runQuery(api.queries.users.getUserByUsername, {
      username: args.username,
    });

    if (!user) {
      throw new Error("Invalid username or password");
    }

    // Verify password with bcrypt
    const validPassword = await bcrypt.compare(args.password, user.passwordHash);
    if (!validPassword) {
      throw new Error("Invalid username or password");
    }

    // Get user's accessible bunks
    const accessibleBunks = await ctx.runQuery(api.queries.users.getUserBunks, {
      userId: user._id,
    });

    const accessibleBunkIds = accessibleBunks.map((ab: any) => ab.bunkId);

    // Generate JWT token
    const tokenPayload = {
      userId: user._id,
      username: user.username,
      role: user.role,
    };
    
    const token = jwt.sign(tokenPayload, getJwtSecret(), {
      expiresIn: JWT_EXPIRY,
    });

    // Return user data with JWT token
    return {
      id: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
      accessibleBunkIds,
      token, // Secure JWT token
      expiresIn: JWT_EXPIRY,
    };
  },
});

/**
 * Register new user (for initial setup of 4 users)
 * Hashes password with bcrypt before storing
 */
export const registerUser = action({
  args: {
    username: v.string(),
    password: v.string(),
    name: v.string(),
    role: v.union(v.literal("admin"), v.literal("super_admin")),
    accessibleBunkIds: v.array(v.id("bunks")),
  },
  handler: async (ctx, args) => {
    // Check if username already exists
    const existing = await ctx.runQuery(api.queries.users.getUserByUsername, {
      username: args.username,
    });

    if (existing) {
      throw new Error("Username already exists");
    }

    // Validate password
    if (args.password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // Hash password with bcrypt (10 rounds)
    const passwordHash = await bcrypt.hash(args.password, 10);

    // Create user
    const userId = await ctx.runMutation(api.mutations.users.createUser, {
      username: args.username.trim(),
      passwordHash,
      name: args.name.trim(),
      role: args.role,
      accessibleBunkIds: args.accessibleBunkIds,
    });

    return {
      id: userId,
      username: args.username,
      name: args.name,
      role: args.role,
    };
  },
});

/**
 * Change password (hashes new password)
 */
export const changePassword = action({
  args: {
    userId: v.id("users"),
    oldPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.runQuery(api.queries.users.getUserByUsername, {
      username: "", // We'll query by ID instead
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify old password
    const validPassword = await bcrypt.compare(args.oldPassword, user.passwordHash);
    if (!validPassword) {
      throw new Error("Current password is incorrect");
    }

    // Validate new password
    if (args.newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters");
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(args.newPassword, 10);

    // Update password
    await ctx.runMutation(api.mutations.users.updatePassword, {
      userId: args.userId,
      newPasswordHash,
    });

    return { success: true };
  },
});

/**
 * Verify JWT token and return user data
 * Use this to validate tokens on protected routes
 */
export const verifyToken = action({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Verify and decode the token
      const decoded = jwt.verify(args.token, getJwtSecret()) as {
        userId: string;
        username: string;
        role: string;
        iat: number;
        exp: number;
      };

      // Get fresh user data from database
      const user = await ctx.runQuery(api.queries.users.getUserByUsername, {
        username: decoded.username,
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Get user's accessible bunks
      const accessibleBunks = await ctx.runQuery(api.queries.users.getUserBunks, {
        userId: user._id,
      });

      const accessibleBunkIds = accessibleBunks.map((ab: any) => ab.bunkId);

      return {
        valid: true,
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          role: user.role,
          accessibleBunkIds,
        },
        expiresAt: new Date(decoded.exp * 1000).toISOString(),
      };
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        return { valid: false, error: "Token expired", expired: true };
      }
      return { valid: false, error: "Invalid token", expired: false };
    }
  },
});

/**
 * Refresh token - get a new token if current one is still valid
 */
export const refreshToken = action({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Verify current token
      const decoded = jwt.verify(args.token, getJwtSecret()) as {
        userId: string;
        username: string;
        role: string;
      };

      // Generate new token with fresh expiry
      const newToken = jwt.sign(
        {
          userId: decoded.userId,
          username: decoded.username,
          role: decoded.role,
        },
        getJwtSecret(),
        { expiresIn: JWT_EXPIRY }
      );

      return {
        success: true,
        token: newToken,
        expiresIn: JWT_EXPIRY,
      };
    } catch (error: any) {
      throw new Error("Cannot refresh - token invalid or expired");
    }
  },
});
