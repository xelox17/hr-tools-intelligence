import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getDemoUserById, getDemoUserByRole } from "./demo-users";
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
 * Fully local demo login — no network call. This used to POST to
 * /api/auth/demo-login on the Vercel API and store the bearer token it
 * returned, but the *published* Power Apps player (unlike the local dev
 * preview, which is a plain browser tab) sandboxes the app and blocks
 * fetch() to an arbitrary external origin — confirmed via a passing CORS
 * preflight against production, ruling out Brave/extensions, and the Power
 * Apps SDK/CLI being entirely connector-/Dataverse-oriented (`pa connector
 * list`, `pa app add data-source`) with no setting to allow raw external
 * fetch. The demo accounts never had a password or server-checked
 * credential anyway, so nothing meaningful was actually being verified —
 * this keeps the same UX without a network dependency the platform won't
 * allow. See the PDD's own target architecture (section 11): SharePoint
 * List / Dataverse, not a call to the Vercel app.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(readStoredUser());
    setReady(true);
  }, []);

  const login = useCallback(async (userId: string): Promise<LoginResult> => {
    const demoUser = getDemoUserById(userId);
    if (!demoUser) return { ok: false, error: "Unknown demo account." };
    writeStoredUser(demoUser);
    setUser(demoUser);
    return { ok: true };
  }, []);

  const switchRole = useCallback(
    async (role: UserRole) => {
      await login(getDemoUserByRole(role).id);
    },
    [login]
  );

  const logout = useCallback(async () => {
    writeStoredUser(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, role: user?.role ?? null, ready, login, switchRole, logout }),
    [user, ready, login, switchRole, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
