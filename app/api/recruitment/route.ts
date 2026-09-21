import type { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { requirePermission } from '@/lib/auth/server-guard';
import { CANDIDATES, POSITIONS } from '@/lib/server/demo-store';

/** GET /api/recruitment — positions and candidates for roles that can open the Recruitment page. */
export async function GET(request: NextRequest) {
  const guard = await requirePermission(request, 'RECRUITMENT', 'view');
  if (!guard.ok) return guard.response;

  return successResponse({ positions: POSITIONS, candidates: CANDIDATES });
}
