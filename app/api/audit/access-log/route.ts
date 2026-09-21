import type { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { getRecentAccessEvents } from '@/lib/auth/middleware';
import { requirePermission } from '@/lib/auth/server-guard';

/**
 * GET /api/audit/access-log — recent denied access attempts recorded by this
 * server instance (the proxy and the API guards write them). ADMIN only.
 */
export async function GET(request: NextRequest) {
  const guard = await requirePermission(request, 'AUDIT_LOGS', 'view');
  if (!guard.ok) return guard.response;

  return successResponse({ events: getRecentAccessEvents() });
}
