import { NextRequest } from 'next/server';
import DatabaseManager from '@/lib/database';
import { successResponse, ErrorResponses } from '@/lib/response';

const ALLOWED_STATUSES = new Set(['acknowledged', 'resolved']);

interface AcknowledgeBody {
  alertId?: string;
  acknowledgedBy?: string;
  status?: string;
}

interface AlertRow {
  id: string;
  rule: string;
  tool_id: string | null;
  severity: string;
  message: string;
  status: string;
  created_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
}

export async function PUT(request: NextRequest) {
  try {
    const body: AcknowledgeBody = await request.json();

    if (!body.alertId || typeof body.alertId !== 'string') {
      return ErrorResponses.badRequest('An "alertId" field is required.');
    }
    if (!body.acknowledgedBy || typeof body.acknowledgedBy !== 'string') {
      return ErrorResponses.badRequest('An "acknowledgedBy" field is required.');
    }
    const targetStatus = body.status && ALLOWED_STATUSES.has(body.status) ? body.status : 'acknowledged';

    const db = DatabaseManager.getInstance();
    await db.connect();

    // No separate resolved_at/resolved_by columns exist on `alerts` — resolving
    // reuses the same acknowledged_* audit columns as acknowledging.
    const result = await db.query<AlertRow>(
      `UPDATE alerts
       SET status = $1, acknowledged_at = COALESCE(acknowledged_at, NOW()), acknowledged_by = COALESCE(acknowledged_by, $2)
       WHERE id = $3 AND status != $1
       RETURNING id, rule, tool_id, severity, message, status, created_at, acknowledged_at, acknowledged_by`,
      [targetStatus, body.acknowledgedBy, body.alertId]
    );

    if (result.rows.length === 0) {
      return ErrorResponses.notFound(`Open alert "${body.alertId}"`);
    }

    return successResponse({ alert: result.rows[0] });
  } catch (error) {
    console.error('❌ Failed to acknowledge alert:', error);
    return ErrorResponses.internalError('Failed to acknowledge alert', error);
  }
}
