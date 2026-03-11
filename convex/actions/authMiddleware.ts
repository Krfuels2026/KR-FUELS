"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import jwt from "jsonwebtoken";

const JWT_ALGORITHM = "HS256";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not configured");
  return secret;
}

export interface AuthPayload {
  userId: string;
  username: string;
  role: "admin" | "super_admin";
  valid: boolean;
  error?: string;
}

// Server-side JWT verification
export const verifyAuth = action({
  args: { token: v.string() },
  handler: async (ctx, args): Promise<AuthPayload> => {
    if (!args.token) {
      return { valid: false, error: "No token provided", userId: "", username: "", role: "admin" };
    }

    try {
      const decoded = jwt.verify(args.token, getJwtSecret(), {
        algorithms: [JWT_ALGORITHM],
      }) as { userId: string; username: string; role: "admin" | "super_admin"; exp: number };

      if (decoded.exp * 1000 < Date.now()) {
        return { valid: false, error: "Token expired", userId: "", username: "", role: "admin" };
      }

      return { valid: true, userId: decoded.userId, username: decoded.username, role: decoded.role };
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        return { valid: false, error: "Token expired", userId: "", username: "", role: "admin" };
      }
      if (error.name === "JsonWebTokenError") {
        return { valid: false, error: "Invalid token", userId: "", username: "", role: "admin" };
      }
      return { valid: false, error: "Authentication failed", userId: "", username: "", role: "admin" };
    }
  },
});

// Verify token and check role permission
export const verifyRole = action({
  args: {
    token: v.string(),
    requiredRole: v.union(v.literal("admin"), v.literal("super_admin")),
  },
  handler: async (ctx, args): Promise<AuthPayload> => {
    if (!args.token) {
      return { valid: false, error: "No token provided", userId: "", username: "", role: "admin" };
    }

    try {
      const decoded = jwt.verify(args.token, getJwtSecret(), {
        algorithms: [JWT_ALGORITHM],
      }) as { userId: string; username: string; role: "admin" | "super_admin"; exp: number };

      if (decoded.exp * 1000 < Date.now()) {
        return { valid: false, error: "Token expired", userId: "", username: "", role: "admin" };
      }

      if (args.requiredRole === "super_admin" && decoded.role !== "super_admin") {
        return { valid: false, error: "Insufficient permissions", userId: decoded.userId, username: decoded.username, role: decoded.role };
      }

      return { valid: true, userId: decoded.userId, username: decoded.username, role: decoded.role };
    } catch (error: any) {
      return { valid: false, error: "Authentication failed", userId: "", username: "", role: "admin" };
    }
  },
});
