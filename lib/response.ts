import { NextResponse } from 'next/server';
import { ApiResponse } from './types';
import { v4 as uuidv4 } from 'uuid';

export function generateRequestId(): string {
  return uuidv4();
}

export function successResponse<T>(
  data: T,
  meta?: { took_ms?: number },
  statusCode: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
        ...meta,
      },
    },
    { status: statusCode }
  );
}

export function errorResponse(
  code: string,
  message: string,
  details?: any,
  statusCode: number = 400
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
      },
    },
    { status: statusCode }
  );
}

export const ErrorResponses = {
  notFound: (resource: string) =>
    errorResponse('NOT_FOUND', `${resource} not found`, null, 404),

  badRequest: (message: string) =>
    errorResponse('BAD_REQUEST', message, null, 400),

  unauthorized: () =>
    errorResponse('UNAUTHORIZED', 'Missing or invalid authentication', null, 401),

  forbidden: () =>
    errorResponse('FORBIDDEN', 'Insufficient permissions', null, 403),

  conflict: (message: string) =>
    errorResponse('CONFLICT', message, null, 409),

  internalError: (message: string = 'Internal server error', error?: any) =>
    errorResponse('INTERNAL_ERROR', message, error?.message, 500),

  methodNotAllowed: () =>
    errorResponse('METHOD_NOT_ALLOWED', 'HTTP method not allowed', null, 405),
};

export function parseQueryParams(searchParams: URLSearchParams) {
  return {
    page: parseInt(searchParams.get('page') || '1', 10),
    pageSize: Math.min(
      parseInt(searchParams.get('pageSize') || '20', 10),
      100
    ),
    orderBy: searchParams.get('orderBy') || 'created_at',
    orderDirection: (searchParams.get('orderDirection') || 'DESC').toUpperCase() as
      | 'ASC'
      | 'DESC',
    search: searchParams.get('search') || '',
    filter: searchParams.get('filter') || '',
  };
}

export function calculatePagination(
  page: number,
  pageSize: number
): { offset: number; limit: number } {
  const validPage = Math.max(1, page);
  const offset = (validPage - 1) * pageSize;
  return { offset, limit: pageSize };
}

export function formatPaginatedQuery(
  baseQuery: string,
  orderBy: string = 'created_at',
  orderDirection: 'ASC' | 'DESC' = 'DESC',
  offset: number = 0,
  limit: number = 20
): string {
  const validColumns = [
    'created_at',
    'updated_at',
    'id',
    'name',
    'email',
    'status',
    'quality_score',
  ];
  const safeOrderBy = validColumns.includes(orderBy) ? orderBy : 'created_at';
  const safeDirection = orderDirection === 'ASC' ? 'ASC' : 'DESC';

  return `${baseQuery} ORDER BY ${safeOrderBy} ${safeDirection} OFFSET ${offset} LIMIT ${limit}`;
}