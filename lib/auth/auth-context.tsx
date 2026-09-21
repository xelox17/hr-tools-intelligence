"use client";

import { createContext, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import { getDemoUserByRole } from "./demo-users";
import type { User, UserRole } from "./types";

export interface AuthContextValue {
  /** The signed-in user, as verified by the server from the session cookie. */
  user: User | null;
  role: UserRole | null;
  /** Demo sign-in as one of the demo accounts. Resolves true when the session cookie was set. */
  login: (userId: string) => Promise<boolean>;
  /** Demo helper: re-sign in with another role's account, then reload so the server re-checks everything. */
  switchRole: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

async function postJson(url: string, body?: unknown): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * The user comes from the server (the root layout verifies the signed session
 * cookie), so the client never decides its own role. Any change of identity
 * ends in a full navigation, which makes the server render everything again.
 */
export function AuthProvider({ user, children }: { user: User | null; children: ReactNode }) {
  const login = useCallback((userId: string) => postJson("/api/auth/demo-login", { userId }), []);

  const switchRole = useCallback(async (role: UserRole) => {
    if (await postJson("/api/auth/demo-login", { userId: getDemoUserByRole(role).id })) window.location.reload();
  }, []);

  const logout = useCallback(async () => {
    await postJson("/api/auth/logout");
    window.location.assign("/login");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, role: user?.role ?? null, login, switchRole, logout }),
    [user, login, switchRole, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
