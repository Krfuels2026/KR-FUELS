"use node";

import { action } from "../_generated/server";
import bcrypt from "bcryptjs";
import { api } from "../_generated/api";

/**
 * Seed Initial Data
 * Run this once to populate the database with initial users and bunks
 */

export const seedInitialData = action({
  handler: async (ctx) => {
    console.log("🌱 Starting database seeding...");

    // Check if bunks already exist
    const existingBunks = await ctx.runQuery(api.queries.bunks.getAllBunks);
    
    let bunkIds: any[] = [];
    
    if (!existingBunks || existingBunks.length === 0) {
      console.log("📍 Creating bunks...");
      
      // Create bunks (fuel stations)
      const bunk1 = await ctx.runMutation(api.mutations.bunks.createBunk, {
        name: "KR FUELS - UDUMELPET",
        code: "UDM01",
        location: "Udumalpet",
      });
      
      const bunk2 = await ctx.runMutation(api.mutations.bunks.createBunk, {
        name: "KR FUELS - DHARAPURAM",
        code: "DRM01",
        location: "Dharapuram",
      });
      
      bunkIds = [bunk1, bunk2];
      console.log("✅ Created 2 bunks");
    } else {
      bunkIds = existingBunks.map((b: any) => b._id);
      console.log(`✅ Found ${existingBunks.length} existing bunks`);
    }

    // Check if users already exist
    const existingUsers = await ctx.runQuery(api.queries.users.getAllUsers);
    
    if (existingUsers && existingUsers.length > 0) {
      console.log(`⚠️  Found ${existingUsers.length} existing users. Skipping user creation.`);
      console.log("🎉 Seeding complete!");
      return {
        success: true,
        message: "Database already seeded",
        bunkCount: bunkIds.length,
        userCount: existingUsers.length,
      };
    }

    console.log("👥 Creating initial 4 users...");

    // Hash passwords (using simple passwords for initial setup)
    // IMPORTANT: Change these passwords after first login!
    const users = [
      {
        username: "admin1",
        password: "admin123",
        name: "Admin User 1",
        role: "admin" as const,
        accessibleBunkIds: bunkIds, // Access to all bunks
      },
      {
        username: "admin2",
        password: "admin123",
        name: "Admin User 2",
        role: "admin" as const,
        accessibleBunkIds: [bunkIds[0]], // Access to first bunk only
      },
      {
        username: "superadmin",
        password: "super123",
        name: "Super Admin",
        role: "super_admin" as const,
        accessibleBunkIds: bunkIds, // Access to all bunks
      },
      {
        username: "manager",
        password: "manager123",
        name: "Manager User",
        role: "admin" as const,
        accessibleBunkIds: [bunkIds[1]], // Access to second bunk only
      },
    ];

    for (const userData of users) {
      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const userId = await ctx.runMutation(api.mutations.users.createUser, {
        username: userData.username,
        passwordHash,
        name: userData.name,
        role: userData.role,
        accessibleBunkIds: userData.accessibleBunkIds,
      });
      
      console.log(`✅ Created user: ${userData.username} (${userData.role})`);
    }

    console.log("🎉 Seeding complete!");
    
    return {
      success: true,
      message: "Database seeded successfully",
      bunkCount: bunkIds.length,
      userCount: users.length,
      credentials: users.map(u => ({
        username: u.username,
        password: u.password,
        role: u.role,
      })),
    };
  },
});
