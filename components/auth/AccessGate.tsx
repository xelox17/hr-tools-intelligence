"use client";

import type { ReactNode } from "react";
import { useRequirePermission } from "@/lib/auth/hooks";
import type { PageKey, PermissionAction } from "@/lib/auth/types";

/**
 * Page-level guard. The proxy already refuses a forbidden URL before any page
 * code runs; this is the client-side backstop. It renders nothing while the
 * role lacks access (so no protected content ever flashes) and redirects to
 * /error/unauthorized.
 */
export function AccessGate({ page, action = "view", children }: { page: PageKey; action?: PermissionAction; children: ReactNode }) {
  return useRequirePermission(page, action) ? <>{children}</> : null;
}
