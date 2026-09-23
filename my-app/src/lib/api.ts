/**
 * Shared bits for the Vercel-hosted API base URL and the AI chat's bearer
 * token (see hooks/useChat.ts). Login itself is now fully local (see
 * lib/auth/auth-context.tsx) — the published Power Apps player sandboxes
 * outbound fetch() to arbitrary external origins, so no network round-trip
 * happens for it. If AI Assistant is ever moved off a raw fetch() too (a
 * Power Platform custom connector, or a local/canned response), this file
 * can most likely go away entirely.
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
