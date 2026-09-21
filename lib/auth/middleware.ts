/**
 * Server-side permission check + audit trail.
 *
 * Runs in the proxy and in API route handlers, where the role comes from the
 * verified session (lib/auth/session.ts) — never from the request body. Only
 * DENIED attempts are recorded: at thousands of users, logging every allowed
 * page view would drown the signal.
 *
 * Denials go to (1) the server console, (2) an in-memory ring buffer read by
 * /api/audit/access-log, and (3) the `audit_trail` table when DATABASE_URL is
 * configured. The buffer is per server instance, so on serverless hosting only
 * the database copy is complete.
 *
 * `canAccess` (roles.ts) is the pure lookup, also usable in the browser. This
 * module imports the database client: keep it out of client components.
 */

import { auditLog } from '@/middleware/audit-log';
import { canAccess, isPageKey, isUserRole } from './roles';
import type { PageKey, PermissionAction, UserRole } from './types';

export interface AccessLogEntry {
  id: string;
  userRole: UserRole;
  userId?: string;
  userName?: string;
  attemptedPage: PageKey;
  attemptedAction: PermissionAction | string;
  timestamp: string;
  result: 'allowed' | 'denied';
  ip?: string;
}

export interface AccessContext {
  userId?: string;
  userName?: string;
  ip?: string;
}

const MAX_BUFFERED_EVENTS = 200;
const DB_WRITE_TIMEOUT_MS = 750;

// Shared through globalThis so the proxy and route handlers see the same buffer
// when they run in one Node process (dev server, `next start`).
const globalStore = globalThis as typeof globalThis & { __hrAccessEvents?: AccessLogEntry[] };
const buffer = (globalStore.__hrAccessEvents ??= []);

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Pure decision plus the audit entry describing it. No side effects. */
export function evaluateAccess(
  userRole: UserRole,
  page: PageKey,
  action: PermissionAction,
  context: AccessContext = {}
): { allowed: boolean; entry: AccessLogEntry } {
  const allowed = isUserRole(userRole) && isPageKey(page) && canAccess(userRole, page, action);
  return {
    allowed,
    entry: {
      id: createId(),
      userRole,
      ...context,
      attemptedPage: page,
      attemptedAction: action,
      timestamp: new Date().toISOString(),
      result: allowed ? 'allowed' : 'denied',
    },
  };
}

async function persistToDatabase(entry: AccessLogEntry): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  const write = auditLog({
    resourceType: 'access_control',
    action: 'ACCESS_DENIED',
    changedBy: entry.userId ?? entry.userRole,
    newValues: { role: entry.userRole, page: entry.attemptedPage, action: entry.attemptedAction },
    ipAddress: entry.ip,
  });
  // A slow database must never hold up the denial response.
  await Promise.race([write, new Promise<void>((resolve) => setTimeout(resolve, DB_WRITE_TIMEOUT_MS))]);
}

export async function recordAccessEvent(entry: AccessLogEntry): Promise<void> {
  if (entry.result !== 'denied') return;

  console.warn(
    `[rbac] DENIED ${entry.userRole} -> ${entry.attemptedPage}.${entry.attemptedAction} user=${entry.userId ?? '-'} ip=${entry.ip ?? '-'}`
  );
  buffer.unshift(entry);
  buffer.length = Math.min(buffer.length, MAX_BUFFERED_EVENTS);

  await persistToDatabase(entry);
}

/** Recent denied attempts on this server instance, newest first. */
export function getRecentAccessEvents(limit = MAX_BUFFERED_EVENTS): AccessLogEntry[] {
  return buffer.slice(0, limit);
}

/** Test helper. */
export function clearAccessEvents(): void {
  buffer.length = 0;
}

/** Returns whether `userRole` may `action` on `page`, recording the attempt when it is denied. */
export async function checkPermission(
  userRole: UserRole,
  page: PageKey,
  action: PermissionAction,
  context: AccessContext = {}
): Promise<boolean> {
  const { allowed, entry } = evaluateAccess(userRole, page, action, context);
  if (!allowed) await recordAccessEvent(entry);
  return allowed;
}
