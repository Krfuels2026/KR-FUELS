import { query } from "../_generated/server";

/**
 * Reminders Queries (Read Operations)
 * PoC: First module migrated to Convex
 */

/**
 * Get all reminders (replaces GET /api/reminders)
 * Sorted by due date (ascending)
 */
export const getAllReminders = query({
  handler: async (ctx) => {
    // For PoC: No auth check
    // In full migration: await getCurrentUser(ctx);
    
    const reminders = await ctx.db
      .query("reminders")
      .order("asc")
      .collect();
    
    // Sort by due date
    return reminders.sort((a, b) => 
      a.dueDate.localeCompare(b.dueDate)
    );
  },
});

/**
 * Get upcoming reminders (within next 7 days)
 * Useful for dashboard notifications
 */
export const getUpcomingReminders = query({
  handler: async (ctx) => {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const reminders = await ctx.db
      .query("reminders")
      .withIndex("by_reminder_date")
      .collect();

    // Filter by date range
    return reminders.filter(
      (r) => r.reminderDate >= today && r.reminderDate <= nextWeek
    ).sort((a, b) => a.reminderDate.localeCompare(b.reminderDate));
  },
});

/**
 * Get overdue reminders
 * Useful for highlighting urgent tasks
 */
export const getOverdueReminders = query({
  handler: async (ctx) => {
    const today = new Date().toISOString().split('T')[0];

    const reminders = await ctx.db
      .query("reminders")
      .withIndex("by_due_date")
      .collect();

    // Filter overdue
    return reminders.filter(
      (r) => r.dueDate < today
    ).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  },
});
