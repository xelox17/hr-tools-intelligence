import { Eye, Lock, Pencil, Unlock, type LucideIcon } from "lucide-react";
import type { PermissionLevel } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

export const PERMISSION_LEVEL_META: Record<PermissionLevel, { label: string; icon: LucideIcon; className: string }> = {
  full: { label: "Full Access", icon: Unlock, className: "text-emerald-700 dark:text-emerald-300" },
  edit: { label: "Edit Access", icon: Pencil, className: "text-amber-700 dark:text-amber-300" },
  read: { label: "Read-Only", icon: Eye, className: "text-primary" },
  none: { label: "No Access", icon: Lock, className: "text-muted-foreground" },
};

interface PermissionIndicatorProps {
  level: PermissionLevel;
  /** Show the text next to the icon (otherwise it is exposed as a tooltip and to screen readers). */
  showLabel?: boolean;
  className?: string;
}

export function PermissionIndicator({ level, showLabel = false, className }: PermissionIndicatorProps) {
  const { label, icon: Icon, className: tone } = PERMISSION_LEVEL_META[level];

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", tone, className)} title={label}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {showLabel ? label : <span className="sr-only">{label}</span>}
    </span>
  );
}
