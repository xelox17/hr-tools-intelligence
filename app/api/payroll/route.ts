import type { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { requirePermission } from '@/lib/auth/server-guard';
import { listPayroll } from '@/lib/server/demo-store';

/**
 * GET /api/payroll — salaries for HR roles, the team's for a manager, the
 * caller's own payslips for an employee. 401 without a session, 403 for roles
 * with no payroll access (e.g. Recruiter).
 */
export async function GET(request: NextRequest) {
  const guard = await requirePermission(request, 'PAYROLL', 'view');
  if (!guard.ok) return guard.response;

  return successResponse(listPayroll(guard.user));
}
