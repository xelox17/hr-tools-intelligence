import { NextRequest } from 'next/server';
import DatabaseManager from '@/lib/database';
import {
  successResponse,
  ErrorResponses,
  parseQueryParams,
  calculatePagination,
  formatPaginatedQuery,
} from '@/lib/response';

interface CreateToolBody {
  name?: string;
  slug?: string;
  description?: string;
  category?: string;
  country?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateToolBody = await request.json();

    if (!body.name || typeof body.name !== 'string') {
      return ErrorResponses.badRequest('A "name" field is required.');
    }
    if (!body.slug || typeof body.slug !== 'string') {
      return ErrorResponses.badRequest('A "slug" field is required.');
    }
    if (!body.category || typeof body.category !== 'string') {
      return ErrorResponses.badRequest('A "category" field is required.');
    }

    const db = DatabaseManager.getInstance();
    await db.connect();

    const existing = await db.query('SELECT id FROM tools WHERE name = $1 OR slug = $2', [
      body.name,
      body.slug,
    ]);
    if (existing.rows.length > 0) {
      return ErrorResponses.conflict('A tool with this name or slug already exists.');
    }

    const result = await db.query(
      `INSERT INTO tools (name, slug, description, category, country, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [body.name, body.slug, body.description ?? null, body.category, body.country ?? null]
    );

    return successResponse(result.rows[0], undefined, 201);
  } catch (error) {
    console.error('❌ Failed to create tool:', error);
    return ErrorResponses.internalError('Failed to create tool', error);
  }
}

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
