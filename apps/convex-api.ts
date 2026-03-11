import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

// ── Authentication ─────────────────────────────────────────────────

export const useLogin = () => useAction((api.actions.auth as any).login);
export const useRegisterUser = () => useAction((api.actions.auth as any).registerUser);
export const useChangePassword = () => useAction(api.actions.auth.changePassword);
export const useVerifyToken = () => useAction((api.actions.auth as any).verifyToken);
export const useRefreshToken = () => useAction((api.actions.auth as any).refreshToken);
export const useAllUsers = () => useQuery(api.queries.users.getAllUsers);

// ── Auth Middleware (Server-side token verification) ────────────────

export const useVerifyAuth = () => useAction((api.actions.authMiddleware as any).verifyAuth);
export const useVerifyRole = () => useAction((api.actions.authMiddleware as any).verifyRole);

// ── Reminders ──────────────────────────────────────────────────────

export const useReminders = () => useQuery(api.queries.reminders.getAllReminders);
export const useUpcomingReminders = () => useQuery(api.queries.reminders.getUpcomingReminders);
export const useOverdueReminders = () => useQuery(api.queries.reminders.getOverdueReminders);
export const useCreateReminder = () => useMutation(api.mutations.reminders.createReminder);
export const useUpdateReminder = () => useMutation(api.mutations.reminders.updateReminder);
export const useDeleteReminder = () => useMutation(api.mutations.reminders.deleteReminder);

// ── Type helper ────────────────────────────────────────────────────

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
