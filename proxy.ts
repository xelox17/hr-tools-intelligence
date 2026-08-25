/**
 * Root Next.js Proxy (formerly "Middleware", renamed in Next.js 16 — see
 * https://nextjs.org/docs/messages/middleware-to-proxy) — runs before
 * every matched request. The task brief asked for `app/middleware.ts`;
 * Next.js only recognizes a Proxy/Middleware file at the project root (or
 * `src/`), so it lives here instead.
 *
 * Pipeline: payload-size guard → identity resolution (JWT bearer token or
 * x-api-key) → rate limit (tiered: public IP / authenticated IP / API
 * key) → sensitive-route auth gate → CORS + security headers on every
 * response, including error responses.
 *
 * Proxy defaults to the Node.js runtime as of Next.js 16 (it was
 * Edge-only before v15.2), so the API-key path below can safely query
 * Postgres via lib/api-keys.ts.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  getClientIp,
  isRateLimitingEnabled,
  RATE_LIMITS,
} from '@/middleware/rate-limit';
import { applyCorsHeaders, isPreflightRequest } from '@/middleware/cors';
import { applySecurityHeaders } from '@/middleware/security-headers';
import { isPayloadTooLarge, MAX_PAYLOAD_BYTES } from '@/middleware/validation';
import {
  authenticateApiKey,
  extractBearerToken,
  isAdminIdentity,
  verifyJwt,
  type JwtIdentity,
} from '@/middleware/auth';

// New, genuinely-sensitive routes only — see docs/SECURITY.md § Authentication
// for why existing routes (dashboard, sync, alerts, exports, webhooks) are
// intentionally left open: none of their current callers (the dashboard UI,
// the n8n workflows) send a token, and requiring one now would break them.
const AUTH_REQUIRED_PREFIXES = ['/api/keys', '/api/admin'];
const ADMIN_REQUIRED_PREFIXES = ['/api/admin'];

function jsonError(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

function finish(request: NextRequest, response: NextResponse): NextResponse {
  return applyCorsHeaders(request, applySecurityHeaders(response)) as NextResponse;
}

export async function proxy(request: NextRequest) {
  if (isPreflightRequest(request)) {
    return finish(request, new NextResponse(null, { status: 204 }));
  }

  return finish(request, await handle(request));
}

async function handle(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (isPayloadTooLarge(request)) {
    return jsonError(413, 'PAYLOAD_TOO_LARGE', `Request body exceeds ${MAX_PAYLOAD_BYTES} bytes.`);
  }

  // Resolve identity: a JWT bearer token takes priority over an API key
  // when both are present.
  const bearerToken = extractBearerToken(request);
  const jwtIdentity = bearerToken ? await verifyJwt(bearerToken) : null;
  const apiKeyRecord = !jwtIdentity ? await authenticateApiKey(request) : null;

  const identity: JwtIdentity | null =
    jwtIdentity ??
    (apiKeyRecord
      ? {
          userId: `apikey:${apiKeyRecord.id}`,
          role: apiKeyRecord.permissions.includes('admin') ? 'admin' : 'user',
          email: apiKeyRecord.owner_email,
        }
      : null);
  const isApiKeyAuth = !jwtIdentity && Boolean(apiKeyRecord);

  if (isRateLimitingEnabled()) {
    const rateLimitConfig = isApiKeyAuth
      ? RATE_LIMITS.PER_API_KEY
      : identity
        ? RATE_LIMITS.AUTHENTICATED_PER_IP
        : RATE_LIMITS.PUBLIC_PER_IP;
    const rateLimitKey = isApiKeyAuth ? `apikey:${apiKeyRecord!.id}` : `ip:${getClientIp(request)}`;

    const result = await checkRateLimit(rateLimitKey, rateLimitConfig);
    if (!result.allowed) {
      console.warn(`⚠️ [proxy] 429 for ${rateLimitKey} on ${pathname}`);
      const response = jsonError(429, 'RATE_LIMITED', 'Too many requests. Please slow down.');
      response.headers.set('Retry-After', String(Math.ceil((result.resetAt - Date.now()) / 1000)));
      return response;
    }
  }

  const requiresAuth = AUTH_REQUIRED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!requiresAuth) {
    return NextResponse.next();
  }

  if (!identity) {
    return jsonError(
      401,
      'UNAUTHORIZED',
      'A valid Bearer token or x-api-key header is required for this route.'
    );
  }

  const requiresAdmin = ADMIN_REQUIRED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (requiresAdmin && !isAdminIdentity(identity)) {
    return jsonError(403, 'FORBIDDEN', 'This route requires the admin role.');
  }

  // Attach the verified identity for downstream route handlers to read
  // (they re-check it themselves too — defense in depth, not blind trust).
  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set('x-user-id', identity.userId);
  forwardedHeaders.set('x-user-role', identity.role);
  if (identity.email) forwardedHeaders.set('x-user-email', identity.email);

  return NextResponse.next({ request: { headers: forwardedHeaders } });
}

export const config = {
  matcher: ['/api/:path*'],
};
