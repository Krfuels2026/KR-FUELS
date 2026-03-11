import { useQuery, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { getToken } from "./lib/auth";

// Helper: get the current session token (throws if missing)
const tok = (): string => {
  const t = getToken();
  if (!t) throw new Error("Not authenticated");
  return t;
};

// ── Authentication ─────────────────────────────────────────────────

export const useLogin = () => useAction((api.actions.auth as any).login);

export const useRegisterUser = () => {
  const fn = useAction((api.actions.auth as any).registerUser);
  return (args: { username: string; password: string; name: string; role: "admin" | "super_admin"; accessibleBunkIds: Id<"bunks">[] }) =>
    fn({ token: tok(), ...args });
};

export const useChangePassword = () => useAction(api.actions.auth.changePassword);
export const useVerifyToken = () => useAction((api.actions.auth as any).verifyToken);
export const useRefreshToken = () => useAction((api.actions.auth as any).refreshToken);

// ── Auth Middleware (Server-side token verification) ────────────────

export const useVerifyAuth = () => useAction((api.actions.authMiddleware as any).verifyAuth);
export const useVerifyRole = () => useAction((api.actions.authMiddleware as any).verifyRole);

// ── Reminders ──────────────────────────────────────────────────────

export const useReminders = () => useQuery(api.queries.reminders.getAllReminders);
export const useUpcomingReminders = () => useQuery(api.queries.reminders.getUpcomingReminders);
export const useOverdueReminders = () => useQuery(api.queries.reminders.getOverdueReminders);

export const useCreateReminder = () => {
  const fn = useAction((api.actions as any).data.createReminder);
  return (args: { title: string; description: string; reminderDate: string; dueDate: string }) =>
    fn({ token: tok(), ...args });
};

export const useUpdateReminder = () => {
  const fn = useAction((api.actions as any).data.updateReminder);
  return (args: { id: Id<"reminders">; title: string; description: string; reminderDate: string; dueDate: string }) =>
    fn({ token: tok(), ...args });
};

export const useDeleteReminder = () => {
  const fn = useAction((api.actions as any).data.deleteReminder);
  return (args: { id: Id<"reminders"> }) => fn({ token: tok(), ...args });
};

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
