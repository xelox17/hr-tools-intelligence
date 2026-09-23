/**
 * API client for the Vercel-hosted backend (github.com/xelox17/hr-tools-intelligence).
 *
 * This code app runs on a different origin than the Next.js app (the Power
 * Apps player, not the Vercel domain), so the httpOnly session cookie the
 * Next.js frontend uses (lib/auth/session.ts there) doesn't reliably reach
 * it — third-party cookies are widely blocked, and the original cookie is
 * SameSite=lax besides. Auth here uses a bearer token instead: POST
 * /api/auth/demo-login already returns the same signed session token in its
 * JSON body (see that route's comment) specifically for this client. We
 * store it in sessionStorage and send it as `Authorization: Bearer <token>`,
 * which getSessionUser() on the server already accepts as an alternative to
 * the cookie.
 *
 * The API's CORS allowlist (middleware/cors.ts) must include this app's
 * origin for the browser to allow reading the response at all — confirm the
 * Power Apps player's real origin once this app is live and update that list
 * if it differs from the default (apps.powerapps.com).
 */

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "https://hr-tools-intelligence.vercel.app";

const TOKEN_KEY = "hr_session_token";

export function getToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage unavailable (private mode / sandboxed player) — the token then
    // only lives for the lifetime of this module (until reload).
  }
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export class ApiRequestError extends Error {
  status: number;
  code: string;
  constructor(status: number, error: ApiError) {
    super(error.message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = error.code;
  }
}

interface Envelope<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/** Calls a JSON API route under API_BASE_URL, attaching the bearer token. Throws ApiRequestError on failure. */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  let body: Envelope<T> | null = null;
  try {
    body = (await response.json()) as Envelope<T>;
  } catch {
    // Non-JSON response (e.g. a network-level error page) falls through to the generic error below.
  }

  if (!response.ok || !body?.success) {
    const error = body?.error ?? { code: "UNKNOWN", message: `Request failed (${response.status}).` };
    throw new ApiRequestError(response.status, error);
  }

  return body.data as T;
}

export const apiGet = <T>(path: string) => apiFetch<T>(path);
export const apiPost = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined });
export const apiDelete = <T>(path: string) => apiFetch<T>(path, { method: "DELETE" });

/**
 * Same as apiPost, but for the two routes that don't use the
 * `{success,data,error}` envelope: /api/auth/demo-login returns
 * `{user,token}` directly and /api/auth/logout returns `{ok:true}` — both
 * predate that convention and weren't changed to keep the existing Next.js
 * frontend (which also expects these exact shapes) working unmodified.
 */
export async function apiPostRaw<T>(path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let json: unknown = null;
  try {
    json = await response.json();
  } catch {
    // fall through to the generic error below
  }

  if (!response.ok) {
    const error = (json as { error?: ApiError } | null)?.error ?? { code: "UNKNOWN", message: `Request failed (${response.status}).` };
    throw new ApiRequestError(response.status, error);
  }

  return json as T;
}
