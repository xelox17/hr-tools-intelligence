/**
 * POST /api/auth/check-permission — body { page, action } -> { allowed, message? }.
 *
 * Answers for the SIGNED-IN user: the role is read from the verified session
 * cookie, never from the request. Denied checks are audited.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/response';
import { getClientIp } from '@/middleware/rate-limit';
import { checkPermission } from '@/lib/auth/middleware';
import { isPageKey } from '@/lib/auth/roles';
import { getSessionUser } from '@/lib/auth/session';
import type { PermissionAction } from '@/lib/auth/types';

const ACTION_PATTERN = /^[A-Za-z]{1,32}$/;

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return errorResponse('UNAUTHORIZED', 'Authentication required.', null, 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('BAD_REQUEST', 'Request body must be valid JSON.', null, 400);
  }

  const { page, action } = (body ?? {}) as Record<string, unknown>;
  if (!isPageKey(page)) return errorResponse('BAD_REQUEST', '"page" must be a valid page key.', null, 400);
  if (typeof action !== 'string' || !ACTION_PATTERN.test(action)) {
    return errorResponse('BAD_REQUEST', '"action" must be a short alphabetic string.', null, 400);
  }

  const allowed = await checkPermission(user.role, page, action as PermissionAction, {
    userId: user.id,
    userName: user.name,
    ip: getClientIp(request),
  });

  return NextResponse.json(
    allowed ? { allowed: true } : { allowed: false, message: `Your role is not allowed to ${action} on ${page}.` }
  );
}
