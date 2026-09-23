import { useContext, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext, type AuthContextValue } from "./auth-context";
import { canAccess, getAccessiblePages } from "./roles";
import type { PageKey, PermissionAction } from "./types";

export const LOGIN_ROUTE = "/login";
export const UNAUTHORIZED_ROUTE = "/error/unauthorized";

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

/** Pages the current role can open, in navigation order. */
export function useAccessiblePages(): PageKey[] {
  const { role } = useAuth();
  return useMemo(() => (role ? getAccessiblePages(role) : []), [role]);
}

/**
 * Client-side route guard. Unlike the Next.js app (a server-side proxy
 * refuses the page before any client code runs), this SPA has no server to
 * gate the route — this hook is the only enforcement of page-level access
 * *for the UI*. The API calls each page makes are still independently
 * checked server-side, so a role that bypassed this client check would still
 * get 401/403 from the API itself.
 */
export function useRequirePermission(page: PageKey, action: PermissionAction = "view"): boolean {
  const { role, ready } = useAuth();
  const navigate = useNavigate();
  const allowed = role ? canAccess(role, page, action) : false;

  useEffect(() => {
    if (!ready) return;
    if (!allowed) navigate(role ? UNAUTHORIZED_ROUTE : LOGIN_ROUTE, { replace: true });
  }, [ready, allowed, role, navigate]);

  return ready && allowed;
}
