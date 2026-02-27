/**
 * Convex API Hooks
 * PoC: Reminders + Authentication use Convex
 */

import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

// ─────────────────────────────────────────────────────
// AUTHENTICATION - Convex Hooks
// ─────────────────────────────────────────────────────

/**
 * Login action (uses bcrypt, Node runtime)
 */
export const useLogin = () => {
  return useAction(api.actions.auth.login);
};

/**
 * Register user action (for initial setup)
 */
export const useRegisterUser = () => {
  return useAction(api.actions.auth.registerUser);
};

/**
 * Change password action
 */
export const useChangePassword = () => {
  return useAction(api.actions.auth.changePassword);
};

/**
 * Get all users query
 */
export const useAllUsers = () => {
  return useQuery(api.queries.users.getAllUsers);
};

// ─────────────────────────────────────────────────────
// REMINDERS - Convex Hooks
// ─────────────────────────────────────────────────────

/**
 * Get all reminders (real-time subscription)
 */
export const useReminders = () => {
  return useQuery(api.queries.reminders.getAllReminders);
};

/**
 * Get upcoming reminders (next 7 days)
 */
export const useUpcomingReminders = () => {
  return useQuery(api.queries.reminders.getUpcomingReminders);
};

/**
 * Get overdue reminders
 */
export const useOverdueReminders = () => {
  return useQuery(api.queries.reminders.getOverdueReminders);
};

/**
 * Create reminder mutation
 */
export const useCreateReminder = () => {
  return useMutation(api.mutations.reminders.createReminder);
};

/**
 * Update reminder mutation
 */
export const useUpdateReminder = () => {
  return useMutation(api.mutations.reminders.updateReminder);
};

/**
 * Delete reminder mutation
 */
export const useDeleteReminder = () => {
  return useMutation(api.mutations.reminders.deleteReminder);
};

// ─────────────────────────────────────────────────────
// Type Helper: Convert Convex Reminder to Frontend Type
// ─────────────────────────────────────────────────────

export type ConvexReminder = {
  _id: Id<"reminders">;
  _creationTime: number;
  title: string;
  description: string;
  reminderDate: string;
  dueDate: string;
  createdBy: string;
  createdAt: number;
};

/**
 * Convert Convex reminder format to frontend Reminder type
 */
export function convexToFrontend(convexReminder: ConvexReminder) {
  return {
    id: convexReminder._id,
    title: convexReminder.title,
    description: convexReminder.description,
    reminderDate: convexReminder.reminderDate,
    dueDate: convexReminder.dueDate,
    createdAt: convexReminder.createdAt,
  };
}
