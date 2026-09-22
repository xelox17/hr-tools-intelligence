/**
 * CORS policy (OWASP A05 — security misconfiguration).
 */

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://lesaffre.com',
  // The Power Apps code app (my-app/) calls this API cross-origin, from
  // whatever origin the Power Apps player hosts it at. apps.powerapps.com is
  // the standard commercial-cloud player origin; confirm the exact origin
  // once the app is live (its network tab shows the real `Origin` header)
  // and add it here — or set CORS_ORIGINS to override this whole list — if
  // it differs (e.g. a per-environment or custom-domain player origin).
  'https://apps.powerapps.com',
];

export const ALLOWED_METHODS = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
export const ALLOWED_HEADERS = 'Content-Type, Authorization, x-api-key';
export const MAX_AGE_SECONDS = 3600;

export function getAllowedOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS;
  if (!raw) return DEFAULT_ALLOWED_ORIGINS;
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/** No Origin header (same-origin requests, curl, server-to-server) is always allowed through. */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true;
  return getAllowedOrigins().includes(origin);
}

export function isPreflightRequest(request: Request): boolean {
  return request.method === 'OPTIONS';
}

export function applyCorsHeaders(request: Request, response: Response): Response {
  const origin = request.headers.get('origin');

  if (origin && isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.append('Vary', 'Origin');
  }

  response.headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS);
  response.headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS);
  response.headers.set('Access-Control-Max-Age', String(MAX_AGE_SECONDS));

  return response;
}
