import type { ReactNode } from "react";
import { useRequirePermission } from "@/lib/auth/hooks";
import type { PageKey, PermissionAction } from "@/lib/auth/types";

/**
 * Page-level guard. Unlike the Next.js app (a server proxy refuses a
 * forbidden URL before any page code runs), this SPA has no server to gate
 * the route — this is the only client-side enforcement. It renders nothing
 * while the role lacks access (so no protected content ever flashes) and
 * redirects to /error/unauthorized.
 */
export function AccessGate({ page, action = "view", children }: { page: PageKey; action?: PermissionAction; children: ReactNode }) {
  return useRequirePermission(page, action) ? <>{children}</> : null;
}
