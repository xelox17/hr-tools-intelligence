/**
 * Authentication (OWASP A07 — identification & authentication failures).
 * Replaces the unused lib/auth.ts stub.
 *
 * JWT verification (verifyJwt) uses `jose` (Web-Crypto-based). API-key
 * auth (authenticateApiKey) queries Postgres via lib/api-keys.ts. Both are
 * called from proxy.ts (project root) — Next.js 16 renamed the
 * `middleware.ts` convention to `proxy.ts` and, as of v16, Proxy defaults
 * to the Node.js runtime (not Edge), so a `pg` connection here is safe;
 * on Next.js <15.5 (Edge-only Middleware) this file would need splitting,
 * since `pg` uses raw TCP sockets the Edge runtime doesn't support.
 */

import { jwtVerify, SignJWT } from 'jose';
import { apiKeyManager, type ApiKeyRecord } from '@/lib/api-keys';

export interface JwtIdentity {
  userId: string;
  role: string;
  email?: string;
}

const DEV_ONLY_FALLBACK_SECRET = 'dev-secret-min-32-characters-long-not-for-prod';

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is not set. Refusing to run in production without it.');
    }
    console.warn(
      '⚠️ [auth] JWT_SECRET is not set — using an insecure dev-only fallback. Set JWT_SECRET before deploying (see .env.example).'
    );
    return new TextEncoder().encode(DEV_ONLY_FALLBACK_SECRET);
  }

  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters (HS256 minimum key strength).');
  }

  return new TextEncoder().encode(secret);
}

export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header) return null;

  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

export function extractApiKey(request: Request): string | null {
  return request.headers.get('x-api-key');
}

/** Edge-safe: verifies the HS256 signature and expiration. Returns null on any failure. */
export async function verifyJwt(token: string): Promise<JwtIdentity | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), { algorithms: ['HS256'] });

    if (typeof payload.sub !== 'string' || typeof payload.role !== 'string') {
      return null;
    }

    return {
      userId: payload.sub,
      role: payload.role,
      email: typeof payload.email === 'string' ? payload.email : undefined,
    };
  } catch {
    return null;
  }
}

/** Issues a token — for a future login route and for tests/fixtures. */
export async function signJwt(identity: JwtIdentity, expiresIn: string = '1h'): Promise<string> {
  return new SignJWT({ role: identity.role, email: identity.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(identity.userId)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getJwtSecret());
}

/** Queries Postgres via APIKeyManager. Returns null if missing/unknown/revoked/expired. */
export async function authenticateApiKey(request: Request): Promise<ApiKeyRecord | null> {
  const key = extractApiKey(request);
  if (!key) return null;
  return apiKeyManager.validateKey(key);
}

function adminEmailAllowlist(): string[] | null {
  const raw = process.env.ADMIN_EMAILS;
  if (!raw) return null;
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * True if the identity's `role` claim is "admin" — and, when ADMIN_EMAILS
 * is configured, also on that allowlist (defense-in-depth: a leaked
 * JWT_SECRET or a mis-issued token can forge a role claim; the email
 * allowlist is a second, independently-configured check).
 */
export function isAdminIdentity(identity: JwtIdentity): boolean {
  if (identity.role !== 'admin') return false;

  const allowlist = adminEmailAllowlist();
  if (!allowlist) return true;

  return identity.email ? allowlist.includes(identity.email.toLowerCase()) : false;
}
