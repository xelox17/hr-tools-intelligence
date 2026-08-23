import { NextRequest } from 'next/server';
import DatabaseManager from '@/lib/database';
import {
  successResponse,
  ErrorResponses,
  parseQueryParams,
  calculatePagination,
  formatPaginatedQuery,
} from '@/lib/response';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const { page, pageSize, orderBy, orderDirection, search } = parseQueryParams(searchParams);
    const { offset, limit } = calculatePagination(page, pageSize);

    const db = DatabaseManager.getInstance();
    await db.connect();

    const whereClause = search ? 'WHERE name ILIKE $1 OR category ILIKE $1' : '';
    const params = search ? [`%${search}%`] : [];

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM tools ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const query = formatPaginatedQuery(
      `SELECT * FROM tools ${whereClause}`,
      orderBy,
      orderDirection,
      offset,
      limit
    );
    const result = await db.query(query, params);

    const durationMs = Date.now() - startTime;

    return successResponse(
      {
        items: result.rows,
        total,
        page,
        pageSize,
        hasMore: offset + result.rows.length < total,
      },
      { took_ms: durationMs }
    );
  } catch (error) {
    console.error('❌ Tools query failed:', error);
    return ErrorResponses.internalError('Failed to fetch tools', error);
  }
}
