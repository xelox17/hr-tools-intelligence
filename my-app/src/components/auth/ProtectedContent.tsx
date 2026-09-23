import type { ReactNode } from "react";
import { usePermission } from "@/lib/auth/hooks";
import type { PageKey, PermissionAction } from "@/lib/auth/types";

interface ProtectedContentProps {
  page: PageKey;
  action: PermissionAction;
  children: ReactNode;
  /** Rendered instead of the children when the role lacks the permission. Nothing by default. */
  fallback?: ReactNode;
}

/**
 * Renders `children` only when the current role holds `action` on `page`.
 * Controls the role cannot use (edit, delete, approve…) are simply not rendered:
 * no lock icons, no greyed-out copies. The matching API routes still refuse
 * the action server-side.
 */
export function ProtectedContent({ page, action, children, fallback = null }: ProtectedContentProps) {
  return usePermission(page, action) ? <>{children}</> : <>{fallback}</>;
}
