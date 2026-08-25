import { NextRequest } from 'next/server';
import DatabaseManager from '@/lib/database';
import {
  successResponse,
  ErrorResponses,
  parseQueryParams,
  calculatePagination,
  formatPaginatedQuery,
} from '@/lib/response';

interface HistoryAlertRow {
  id: string;
  rule: string;
  tool: string | null;
  severity: string;
  message: string;
  status: string;
  created_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, pageSize, orderBy, orderDirection } = parseQueryParams(searchParams);
    const { offset, limit } = calculatePagination(page, pageSize);

    const severity = searchParams.get('severity');
    const tool = searchParams.get('tool');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (startDate) {
      params.push(startDate);
      conditions.push(`a.created_at >= $${params.length}`);
    } else {
      conditions.push(`a.created_at >= NOW() - INTERVAL '30 days'`);
    }

    if (endDate) {
      params.push(endDate);
      conditions.push(`a.created_at <= $${params.length}`);
    }

    if (severity) {
      params.push(severity);
      conditions.push(`a.severity = $${params.length}`);
    }

    if (tool) {
      params.push(tool);
      conditions.push(`t.slug = $${params.length}`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const fromClause = `FROM alerts a LEFT JOIN tools t ON t.id = a.tool_id ${whereClause}`;

    const db = DatabaseManager.getInstance();
    await db.connect();

    const countResult = await db.query<{ total: string }>(`SELECT COUNT(*) AS total ${fromClause}`, params);
    const total = Number(countResult.rows[0]?.total ?? 0);

    const query = formatPaginatedQuery(
      `SELECT a.id, a.rule, t.slug AS tool, a.severity, a.message, a.status, a.created_at, a.acknowledged_at, a.acknowledged_by ${fromClause}`,
      orderBy,
      orderDirection,
      offset,
      limit
    );
    const result = await db.query<HistoryAlertRow>(query, params);

    return successResponse({
      items: result.rows,
      total,
      page,
      pageSize,
      hasMore: offset + result.rows.length < total,
    });
  } catch (error) {
    console.error('❌ Failed to fetch alert history:', error);
    return ErrorResponses.internalError('Failed to fetch alert history', error);
  }
}
