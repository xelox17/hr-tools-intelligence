import type { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { requirePermission } from '@/lib/auth/server-guard';
import { listTeam } from '@/lib/server/demo-store';

/** GET /api/team — the directory, scoped to the caller's role (all / own team / self). 401 or 403 otherwise. */
export async function GET(request: NextRequest) {
  const guard = await requirePermission(request, 'TEAM', 'view');
  if (!guard.ok) return guard.response;

  return successResponse(listTeam(guard.user));
}
