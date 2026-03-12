import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Reminders Mutations (Write Operations)
 * PoC: First module migrated to Convex
 */

/**
 * Create reminder (replaces POST /api/reminders)
 */
export const createReminder = internalMutation({
  args: {
    title: v.string(),
    description: v.string(),
    reminderDate: v.string(),  // 'YYYY-MM-DD'
    dueDate: v.string(),       // 'YYYY-MM-DD'
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    // For PoC: No auth check
    // In full migration: const user = await getCurrentUser(ctx);

    // Validate
    if (!args.title.trim()) {
      throw new Error("Title is required");
    }

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
      createdBy: args.createdBy,
      createdAt: Date.now(),
    });

    return await ctx.db.get(reminderId);
  },
});

/**
 * Update reminder (replaces PATCH /api/reminders/:id)
 */
export const updateReminder = internalMutation({
  args: {
    id: v.id("reminders"),
    title: v.string(),
    description: v.string(),
    reminderDate: v.string(),
    dueDate: v.string(),
  },
  handler: async (ctx, args) => {
    // For PoC: No auth check
    // In full migration: await getCurrentUser(ctx);

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Reminder not found");
    }

    // Validate
    if (!args.title.trim()) {
      throw new Error("Title is required");
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.reminderDate)) {
      throw new Error("Invalid reminder date format. Use YYYY-MM-DD");
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.dueDate)) {
      throw new Error("Invalid due date format. Use YYYY-MM-DD");
    }

    // Update
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
export const deleteReminder = internalMutation({
  args: {
    id: v.id("reminders"),
  },
  handler: async (ctx, args) => {
    // For PoC: No auth check
    // In full migration: await getCurrentUser(ctx);

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Reminder not found");
    }

    await ctx.db.delete(args.id);
    
    return { success: true, id: args.id };
  },
});
