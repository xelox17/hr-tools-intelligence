/**
 * Guard for API route handlers. The caller's identity is the verified session
 * (cookie or session bearer token) — the request body is never trusted for it.
 *
 *   const guard = await requirePermission(request, 'PAYROLL', 'view');
 *   if (!guard.ok) return guard.response;   // 401 or 403
 *   // guard.user is the authenticated, authorised user
 */

import { errorResponse } from '@/lib/response';
import { getClientIp } from '@/middleware/rate-limit';
import { checkPermission } from './middleware';
import { getSessionUser } from './session';
import type { PageKey, PermissionAction, User } from './types';

export type GuardResult = { ok: true; user: User } | { ok: false; response: ReturnType<typeof errorResponse> };

export async function requirePermission(request: Request, page: PageKey, action: PermissionAction): Promise<GuardResult> {
  const user = await getSessionUser(request);
  if (!user) {
    return { ok: false, response: errorResponse('UNAUTHORIZED', 'Authentication required.', null, 401) };
  }

  const allowed = await checkPermission(user.role, page, action, {
    userId: user.id,
    userName: user.name,
    ip: getClientIp(request),
  });
  if (!allowed) {
    return { ok: false, response: errorResponse('FORBIDDEN', 'Your role does not allow this action.', null, 403) };
  }

  return { ok: true, user };
}
