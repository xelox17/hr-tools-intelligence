import { ROLE_LABELS } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

/** CSS class (defined in globals.css) that sets the role's badge colour variables. */
export function roleClass(role: UserRole): string {
  return `role-badge-${role.toLowerCase().replace("_", "-")}`;
}

export function RoleBadge({ role, className }: { role: UserRole; className?: string }) {
  return <span className={cn("role-badge", roleClass(role), className)}>{ROLE_LABELS[role]}</span>;
}
