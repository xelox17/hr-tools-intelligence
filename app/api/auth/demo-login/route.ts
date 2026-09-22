/**
 * POST /api/auth/demo-login — body { userId }.
 *
 * DEMO ONLY: signs the visitor in as one of the demo accounts, with no
 * password. In production this route is replaced by the SSO callback that
 * issues the same session token. Set DEMO_AUTH_ENABLED=false to switch it off.
 *
 * Returns the token two ways: as the httpOnly cookie (for the same-origin
 * Next.js app — see lib/auth/session.ts) AND in the JSON body (for the
 * Power Apps code app, hosted on a different origin: the Power Apps player's
 * origin can't reliably receive a SameSite cookie set by this API, so that
 * client stores this token itself and sends it back as
 * `Authorization: Bearer <token>` — getSessionUser() already accepts either).
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/response';
import { getDemoUserById } from '@/lib/auth/demo-users';
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS, signSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  if (process.env.DEMO_AUTH_ENABLED === 'false') {
    return errorResponse('NOT_FOUND', 'Demo sign-in is disabled.', null, 404);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('BAD_REQUEST', 'Request body must be valid JSON.', null, 400);
  }

  const userId = (body as { userId?: unknown } | null)?.userId;
  const user = typeof userId === 'string' ? getDemoUserById(userId) : undefined;
  if (!user) {
    return errorResponse('BAD_REQUEST', 'Unknown demo account.', null, 400);
  }

  let token: string;
  try {
    token = await signSession(user);
  } catch (error) {
    // Typically: JWT_SECRET missing in production. Say so in the server log, not to the client.
    console.error('[auth] Could not sign the session:', error instanceof Error ? error.message : error);
    return errorResponse('SERVICE_UNAVAILABLE', 'Sign-in is temporarily unavailable.', null, 503);
  }

  const response = NextResponse.json({ user, token });
  response.cookies.set(SESSION_COOKIE, token, { ...SESSION_COOKIE_OPTIONS, secure: process.env.NODE_ENV === 'production' });
  return response;
}
