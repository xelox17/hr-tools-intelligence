"use client";

import { useContext, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AuthContext, type AuthContextValue } from "./auth-context";
import { canAccess, getAccessiblePages } from "./roles";
import { LOGIN_ROUTE, UNAUTHORIZED_ROUTE } from "./page-gate";
import type { PageKey, PermissionAction } from "./types";

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>.");
  return context;
}

/** Whether the current user may perform `action` on `page` (false when signed out). Pure, no logging. */
export function usePermission(page: PageKey, action: PermissionAction): boolean {
  const { role } = useAuth();
  return role ? canAccess(role, page, action) : false;
}

/** Pages the current role can open, in navigation order. A constant-size lookup, memoised per role. */
export function useAccessiblePages(): PageKey[] {
  const { role } = useAuth();
  return useMemo(() => (role ? getAccessiblePages(role) : []), [role]);
}

/**
 * Client-side second line of defence behind the proxy: if the role cannot
 * `action` on `page` (e.g. the session changed in another tab), leave for the
 * unauthorized page. Returns whether the page may render.
 */
export function useRequirePermission(page: PageKey, action: PermissionAction = "view"): boolean {
  const { role } = useAuth();
  const router = useRouter();
  const allowed = role ? canAccess(role, page, action) : false;

  useEffect(() => {
    if (!allowed) router.replace(role ? UNAUTHORIZED_ROUTE : LOGIN_ROUTE);
  }, [allowed, role, router]);

  return allowed;
}
