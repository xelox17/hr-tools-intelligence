/**
 * Signed browser session (the "JWT" of the demo login).
 *
 * The role that gates pages and API routes comes from this cookie, verified
 * server-side on every request — never from localStorage or a request body.
 *
 * The signing key is derived from JWT_SECRET plus a suffix, so a session token
 * can never be accepted as an API bearer token (middleware/auth.ts) or vice
 * versa. The cookie is httpOnly, so page scripts cannot read or edit it.
 *
 * Demo caveat: /api/auth/demo-login issues a session for any demo account
 * without a password. In production, an SSO callback would issue this same
 * token after authenticating the user.
 */

import { jwtVerify, SignJWT } from 'jose';
import { getJwtSecret } from './secret';
import { getDemoUserById } from './demo-users';
import { isUserRole } from './roles';
import type { User, UserRole } from './types';

export const SESSION_COOKIE = 'hr_session';
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

const AUDIENCE = 'hr-session';
const KEY_SUFFIX = new TextEncoder().encode(':hr-session-v1');

export interface SessionClaims {
  userId: string;
  role: UserRole;
}

function sessionKey(): Uint8Array {
  const base = getJwtSecret();
  const key = new Uint8Array(base.length + KEY_SUFFIX.length);
  key.set(base);
  key.set(KEY_SUFFIX, base.length);
  return key;
}

export async function signSession(user: User): Promise<string> {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(sessionKey());
}

/** Returns the claims of a valid, unexpired session token, or null. Never throws. */
export async function verifySession(token: string | undefined | null): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionKey(), { algorithms: ['HS256'], audience: AUDIENCE });
    if (typeof payload.sub !== 'string' || !isUserRole(payload.role)) return null;
    return { userId: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

/** Maps verified claims to a known account (a production system would query its user store here). */
export function resolveSessionUser(claims: SessionClaims | null): User | null {
  if (!claims) return null;
  const user = getDemoUserById(claims.userId);
  return user && user.role === claims.role ? user : null;
}

export async function getUserFromToken(token: string | undefined | null): Promise<User | null> {
  return resolveSessionUser(await verifySession(token));
}

function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

/** Session user of a request: the session cookie, or an `Authorization: Bearer <session token>` header. */
export async function getSessionUser(request: Request): Promise<User | null> {
  const fromCookie = readCookie(request.headers.get('cookie'), SESSION_COOKIE);
  if (fromCookie) return getUserFromToken(fromCookie);

  const [scheme, token] = (request.headers.get('authorization') ?? '').split(' ');
  return scheme === 'Bearer' ? getUserFromToken(token) : null;
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE_SECONDS,
};
