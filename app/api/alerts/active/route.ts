import DatabaseManager from '@/lib/database';
import { successResponse, ErrorResponses } from '@/lib/response';

interface ActiveAlertRow {
  id: string;
  rule: string;
  tool: string | null;
  severity: string;
  message: string;
  status: string;
  created_at: string;
  acknowledged_at: string | null;
}

export async function GET() {
  try {
    const db = DatabaseManager.getInstance();
    await db.connect();

    const result = await db.query<ActiveAlertRow>(
      `SELECT a.id, a.rule, t.slug AS tool, a.severity, a.message, a.status, a.created_at, a.acknowledged_at
       FROM alerts a
       LEFT JOIN tools t ON t.id = a.tool_id
       WHERE a.status = 'open'
       ORDER BY a.created_at DESC`
    );

    return successResponse({ alerts: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('❌ Failed to list active alerts:', error);
    return ErrorResponses.internalError('Failed to list active alerts', error);
  }
}
