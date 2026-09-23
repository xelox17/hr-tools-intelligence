import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { apiPostRaw, ApiRequestError, setToken } from "@/lib/api";
import { getDemoUserByRole } from "./demo-users";
import { isUserRole } from "./roles";
import type { User, UserRole } from "./types";

const USER_STORAGE_KEY = "hr_session_user";

function readStoredUser(): User | null {
  try {
    const raw = sessionStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    return isUserRole(parsed.role) ? parsed : null;
  } catch {
    return null;
  }
}

function writeStoredUser(user: User | null): void {
  try {
    if (user) sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    // Storage unavailable — the session then only lives for this page load.
  }
}

export interface LoginResult {
  ok: boolean;
  /** The actual underlying failure, surfaced to the login screen instead of a generic message. */
  error?: string;
}

export interface AuthContextValue {
  user: User | null;
  role: UserRole | null;
  ready: boolean;
  login: (userId: string) => Promise<LoginResult>;
  switchRole: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Same demo-account model as the Next.js app, but the session lives in
 * sessionStorage (a bearer token + the user object) instead of an httpOnly
 * cookie — see lib/api.ts for why. `ready` is false only for the first
 * render, so pages can avoid a flash of the login screen while sessionStorage
 * is read.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(readStoredUser());
    setReady(true);
  }, []);

  const applySession = useCallback((nextUser: User, token: string) => {
    setToken(token);
    writeStoredUser(nextUser);
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (userId: string): Promise<LoginResult> => {
      try {
        const result = await apiPostRaw<{ user: User; token: string }>("/api/auth/demo-login", { userId });
        applySession(result.user, result.token);
        return { ok: true };
      } catch (error) {
        // Surface the real cause (network/CORS failure vs. a JSON error body
        // from the API) instead of a single generic message — this was the
        // only way to diagnose the demo-login envelope bug earlier, and the
        // same visibility helps for e.g. a CORS origin mismatch in prod.
        let message = "Unknown error.";
        if (error instanceof ApiRequestError) message = `${error.code}: ${error.message}`;
        else if (error instanceof TypeError) message = `Network/CORS failure: ${error.message}`;
        else if (error instanceof Error) message = error.message;
        return { ok: false, error: message };
      }
    },
    [applySession]
  );

  const switchRole = useCallback(
    async (role: UserRole) => {
      await login(getDemoUserByRole(role).id);
    },
    [login]
  );

  const logout = useCallback(async () => {
    try {
      await apiPostRaw("/api/auth/logout");
    } catch {
      // Best-effort server-side cleanup; the client session is cleared regardless.
    }
    setToken(null);
    writeStoredUser(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, role: user?.role ?? null, ready, login, switchRole, logout }),
    [user, ready, login, switchRole, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
