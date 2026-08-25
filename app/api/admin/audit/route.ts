import { NextRequest } from 'next/server';
import DatabaseManager from '@/lib/database';
import { successResponse, ErrorResponses } from '@/lib/response';

// Gated by proxy.ts's ADMIN_REQUIRED_PREFIXES (/api/admin/*) — a valid
// Bearer JWT with role: admin is required before this handler even runs.
// Re-checked here too (defense in depth — same pattern as the other
// /api/admin and /api/keys routes).
function requireAdmin(request: NextRequest): boolean {
  return request.headers.get('x-user-role') === 'admin' && Boolean(request.headers.get('x-user-id'));
}

interface AuditRow {
  id: number;
  resource_type: string | null;
  resource_id: string | null;
  action: string | null;
  old_values: unknown;
  new_values: unknown;
  changed_by: string | null;
  change_reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) {
    return ErrorResponses.forbidden();
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
    const offset = (page - 1) * pageSize;

    const resourceType = searchParams.get('resourceType');
    const action = searchParams.get('action');
    const changedBy = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (resourceType) {
      params.push(resourceType);
      conditions.push(`resource_type = $${params.length}`);
    }
    if (action) {
      params.push(action);
      conditions.push(`action = $${params.length}`);
    }
    if (changedBy) {
      params.push(changedBy);
      conditions.push(`changed_by = $${params.length}`);
    }
    if (startDate) {
      params.push(startDate);
      conditions.push(`created_at >= $${params.length}`);
    }
    if (endDate) {
      params.push(endDate);
      conditions.push(`created_at <= $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const db = DatabaseManager.getInstance();
    await db.connect();

    const countResult = await db.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM audit_trail ${whereClause}`,
      params
    );
    const total = Number(countResult.rows[0]?.total ?? 0);

    const result = await db.query<AuditRow>(
      `SELECT id, resource_type, resource_id, action, old_values, new_values, changed_by, change_reason, ip_address, user_agent, created_at
       FROM audit_trail
       ${whereClause}
       ORDER BY created_at DESC
       OFFSET $${params.length + 1} LIMIT $${params.length + 2}`,
      [...params, offset, pageSize]
    );

    return successResponse({
      items: result.rows,
      total,
      page,
      pageSize,
      hasMore: offset + result.rows.length < total,
    });
  } catch (error) {
    console.error('❌ Failed to list audit trail:', error);
    return ErrorResponses.internalError('Failed to list audit trail', error);
  }
}
