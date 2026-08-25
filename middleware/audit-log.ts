/**
 * Audit trail (OWASP A09 — security logging & monitoring failures).
 *
 * Node-only (queries Postgres) — call from route handlers after a
 * POST/PUT/PATCH/DELETE completes, not from the Edge middleware. Writes to
 * the `audit_trail` table already defined in 01_lesaffre_schema.sql.
 */

import DatabaseManager from '@/lib/database';

export interface AuditLogEntry {
  resourceType: string;
  /** Must be a UUID to fit the audit_trail.resource_id column — omit for non-UUID ids (e.g. api_keys' integer id) and put the id in newValues instead. */
  resourceId?: string;
  action: string;
  oldValues?: unknown;
  newValues?: unknown;
  changedBy: string;
  changeReason?: string;
  ipAddress?: string;
  userAgent?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function auditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const db = DatabaseManager.getInstance();
    await db.connect();

    const resourceId = entry.resourceId && UUID_RE.test(entry.resourceId) ? entry.resourceId : null;

    await db.query(
      `INSERT INTO audit_trail
         (resource_type, resource_id, action, old_values, new_values, changed_by, change_reason, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        entry.resourceType,
        resourceId,
        entry.action,
        entry.oldValues !== undefined ? JSON.stringify(entry.oldValues) : null,
        entry.newValues !== undefined ? JSON.stringify(entry.newValues) : null,
        entry.changedBy,
        entry.changeReason ?? null,
        entry.ipAddress ?? null,
        entry.userAgent ?? null,
      ]
    );
  } catch (error) {
    // Never let audit logging break the request it's auditing.
    console.error('❌ [audit-log] Failed to write audit trail entry:', error);
  }
}
