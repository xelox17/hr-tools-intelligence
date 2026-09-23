import type { PageKey, PermissionAction, UserRole } from "./types";

/**
 * Shape returned by GET /api/audit/access-log. The server-side recording
 * logic (lib/auth/middleware.ts in the Next.js app) is Node/DB-only and has
 * no browser equivalent here — this is just the response type.
 */
export interface AccessLogEntry {
  id: string;
  userRole: UserRole;
  userId?: string;
  userName?: string;
  attemptedPage: PageKey;
  attemptedAction: PermissionAction | string;
  timestamp: string;
  result: "allowed" | "denied";
  ip?: string;
}
