"use client";

/**
 * There is no login flow in this frontend yet — /api/keys and
 * /api/admin/* require a Bearer JWT (see proxy.ts), but nothing issues one
 * to a browser session. This is a pragmatic bridge: persist a
 * user-provided token in localStorage and attach it to admin fetches,
 * until a real auth/login page exists. See docs/FRONTEND.md.
 */

import { useLocalStorage } from "./useLocalStorage";

const STORAGE_KEY = "hrt_admin_token";

export function useAdminToken() {
  const [token, setToken] = useLocalStorage<string>(STORAGE_KEY, "");
  return { token, setToken, hasToken: token.trim().length > 0 };
}

export function authHeaders(token: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
