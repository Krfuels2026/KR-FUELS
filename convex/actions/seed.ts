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

/**
 * Seed Dummy Data — Petrol Bunk Accounts, Vouchers, Reminders
 * Run AFTER seedInitialData
 */
export const seedDummyData = action({
  handler: async (ctx) => {
    console.log("📦 Seeding dummy petrol bunk data...");

    const bunks = await ctx.runQuery(api.queries.bunks.getAllBunks);
    if (!bunks || bunks.length === 0) {
      throw new Error("Run seedInitialData first to create bunks.");
    }

    const results: any[] = [];

    for (const bunk of bunks) {
      const bunkId = bunk._id;
      console.log(`\n🏪 Seeding: ${bunk.name}`);

      // ── ACCOUNTS ────────────────────────────────────────────────────
      const cashId = await ctx.runMutation(api.mutations.accounts.createAccount, {
        name: "Cash in Hand", bunkId, openingDebit: 50000, openingCredit: 0,
      });
      const bankId = await ctx.runMutation(api.mutations.accounts.createAccount, {
        name: "Bank Account (SBI)", bunkId, openingDebit: 200000, openingCredit: 0,
      });
      const salesId = await ctx.runMutation(api.mutations.accounts.createAccount, {
        name: "Sales", bunkId, openingDebit: 0, openingCredit: 0,
      });
      const expensesId = await ctx.runMutation(api.mutations.accounts.createAccount, {
        name: "Expenses", bunkId, openingDebit: 0, openingCredit: 0,
      });
      const debtorsId = await ctx.runMutation(api.mutations.accounts.createAccount, {
        name: "Sundry Debtors", bunkId, openingDebit: 0, openingCredit: 0,
      });
      const creditorsId = await ctx.runMutation(api.mutations.accounts.createAccount, {
        name: "Sundry Creditors", bunkId, openingDebit: 0, openingCredit: 0,
      });
      const petrolSalesId = await ctx.runMutation(api.mutations.accounts.createAccount, {
        name: "Petrol Sales", bunkId, parentId: salesId, openingDebit: 0, openingCredit: 0,
      });
      const hsdSalesId = await ctx.runMutation(api.mutations.accounts.createAccount, {
        name: "HSD (Diesel) Sales", bunkId, parentId: salesId, openingDebit: 0, openingCredit: 0,
      });
      const lubesSalesId = await ctx.runMutation(api.mutations.accounts.createAccount, {
        name: "Lubricants Sales", bunkId, parentId: salesId, openingDebit: 0, openingCredit: 0,
      });
      const salaryId = await ctx.runMutation(api.mutations.accounts.createAccount, {
        name: "Staff Salary", bunkId, parentId: expensesId, openingDebit: 0, openingCredit: 0,
      });
      const electricityId = await ctx.runMutation(api.mutations.accounts.createAccount, {
        name: "Electricity Bill", bunkId, parentId: expensesId, openingDebit: 0, openingCredit: 0,
      });
      const maintenanceId = await ctx.runMutation(api.mutations.accounts.createAccount, {
        name: "Pump Maintenance", bunkId, parentId: expensesId, openingDebit: 0, openingCredit: 0,
      });
      const ioclId = await ctx.runMutation(api.mutations.accounts.createAccount, {
        name: "IOCL (Supplier)", bunkId, parentId: creditorsId, openingDebit: 0, openingCredit: 150000,
      });
      const fleetId = await ctx.runMutation(api.mutations.accounts.createAccount, {
        name: "ABC Transports (Fleet)", bunkId, parentId: debtorsId, openingDebit: 45000, openingCredit: 0,
      });
      console.log(`  ✅ Created 14 accounts`);

      // ── VOUCHERS (last 7 days) ─────────────────────────────────────
      const today = new Date();
      const vouchers = [
        { daysAgo: 6, accountId: petrolSalesId, debit: 0,      credit: 85000,  desc: "Petrol sales - morning shift" },
        { daysAgo: 6, accountId: hsdSalesId,    debit: 0,      credit: 120000, desc: "Diesel sales - morning shift" },
        { daysAgo: 6, accountId: cashId,         debit: 205000, credit: 0,      desc: "Cash collection" },
        { daysAgo: 5, accountId: petrolSalesId, debit: 0,      credit: 92000,  desc: "Petrol sales" },
        { daysAgo: 5, accountId: hsdSalesId,    debit: 0,      credit: 134000, desc: "Diesel sales" },
        { daysAgo: 5, accountId: ioclId,         debit: 500000, credit: 0,      desc: "Payment to IOCL for fuel supply" },
        { daysAgo: 5, accountId: bankId,         debit: 0,      credit: 500000, desc: "Bank transfer to IOCL" },
        { daysAgo: 4, accountId: petrolSalesId, debit: 0,      credit: 78000,  desc: "Petrol sales" },
        { daysAgo: 4, accountId: hsdSalesId,    debit: 0,      credit: 110000, desc: "Diesel sales" },
        { daysAgo: 4, accountId: lubesSalesId,  debit: 0,      credit: 12000,  desc: "Lubricants sold" },
        { daysAgo: 4, accountId: salaryId,       debit: 25000,  credit: 0,      desc: "Staff salary paid" },
        { daysAgo: 4, accountId: cashId,         debit: 0,      credit: 25000,  desc: "Salary disbursement" },
        { daysAgo: 3, accountId: petrolSalesId, debit: 0,      credit: 105000, desc: "Petrol sales - high traffic" },
        { daysAgo: 3, accountId: hsdSalesId,    debit: 0,      credit: 160000, desc: "Diesel sales - trucks" },
        { daysAgo: 3, accountId: fleetId,        debit: 0,      credit: 45000,  desc: "ABC Transports payment received" },
        { daysAgo: 2, accountId: petrolSalesId, debit: 0,      credit: 88000,  desc: "Petrol sales" },
        { daysAgo: 2, accountId: hsdSalesId,    debit: 0,      credit: 125000, desc: "Diesel sales" },
        { daysAgo: 2, accountId: electricityId,  debit: 8500,   credit: 0,      desc: "Electricity bill paid" },
        { daysAgo: 2, accountId: cashId,         debit: 0,      credit: 8500,   desc: "Electricity payment" },
        { daysAgo: 1, accountId: petrolSalesId, debit: 0,      credit: 96000,  desc: "Petrol sales" },
        { daysAgo: 1, accountId: hsdSalesId,    debit: 0,      credit: 142000, desc: "Diesel sales" },
        { daysAgo: 1, accountId: maintenanceId,  debit: 4500,   credit: 0,      desc: "Pump-2 servicing" },
        { daysAgo: 1, accountId: cashId,         debit: 0,      credit: 4500,   desc: "Maintenance payment" },
        { daysAgo: 0, accountId: petrolSalesId, debit: 0,      credit: 72000,  desc: "Petrol sales - today" },
        { daysAgo: 0, accountId: hsdSalesId,    debit: 0,      credit: 98000,  desc: "Diesel sales - today" },
        { daysAgo: 0, accountId: cashId,         debit: 170000, credit: 0,      desc: "Cash collection - today" },
      ];

      for (const v of vouchers) {
        const d = new Date(today);
        d.setDate(d.getDate() - v.daysAgo);
        const txnDate = d.toISOString().split("T")[0];
        await ctx.runMutation(api.mutations.vouchers.createVoucher, {
          txnDate, bunkId,
          accountId: v.accountId,
          debit: v.debit,
          credit: v.credit,
          description: v.desc,
        });
      }
      console.log(`  ✅ Created ${vouchers.length} vouchers`);

      // ── REMINDERS ─────────────────────────────────────────────────
      const reminders = [
        { title: "IOCL Tank Lorry Payment",    desc: "Pay outstanding ₹1,50,000 to IOCL for Feb fuel supply",        remDay: 1, dueDay: 3  },
        { title: "Renew Trade License",         desc: "Annual trade license renewal due with local municipality",       remDay: 3, dueDay: 7  },
        { title: "Pump Calibration Check",      desc: "Calibration check for Pump-1 & Pump-3 by Weights & Measures",   remDay: 2, dueDay: 5  },
        { title: "GST Filing - Monthly",        desc: "File GSTR-1 and GSTR-3B for the current month",                 remDay: 5, dueDay: 10 },
        { title: "Staff Salary Due",            desc: "Process payroll for all 8 staff members",                        remDay: 0, dueDay: 2  },
        { title: "Fire Safety NOC Renewal",     desc: "Annual fire safety inspection and NOC renewal with fire dept",   remDay: 7, dueDay: 14 },
      ];

      for (const r of reminders) {
        await ctx.runMutation(api.mutations.reminders.createReminder, {
          title: r.title,
          description: r.desc,
          reminderDate: offsetDate(today, r.remDay),
          dueDate: offsetDate(today, r.dueDay),
        });
      }
      console.log(`  ✅ Created ${reminders.length} reminders`);

      results.push({ bunk: bunk.name, accounts: 14, vouchers: vouchers.length, reminders: reminders.length });
    }

    console.log("\n🎉 Dummy data seeding complete!");
    return { success: true, results };
  },
});

function offsetDate(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
