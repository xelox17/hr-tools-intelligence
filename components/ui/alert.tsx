"use client";

import type { ReactNode } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type AlertType = "success" | "error" | "warning" | "info";

export interface ShowAlertOptions {
  type: AlertType;
  title: string;
  description?: string;
  /** ms before auto-dismiss. Pass `false` to make it persistent (until manually dismissed). */
  duration?: number | false;
  action?: { label: string; onClick: () => void };
}

/** Toast wrapper around sonner — auto-dismisses after 5s by default, or stays until dismissed with `duration: false`. */
export function showAlert({ type, title, description, duration = 5000, action }: ShowAlertOptions) {
  const options = {
    description,
    duration: duration === false ? Infinity : duration,
    action: action ? { label: action.label, onClick: action.onClick } : undefined,
  };

  if (type === "success") toast.success(title, options);
  else if (type === "error") toast.error(title, options);
  else if (type === "warning") toast.warning(title, options);
  else toast.info(title, options);
}

const TYPE_CONFIG: Record<AlertType, { icon: typeof CheckCircle2; className: string }> = {
  success: {
    icon: CheckCircle2,
    className: "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
  },
  error: {
    icon: XCircle,
    className: "border-red-300 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-yellow-300 bg-yellow-50 text-yellow-900 dark:border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-200",
  },
  info: {
    icon: Info,
    className: "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200",
  },
};

interface InlineAlertProps {
  type: AlertType;
  title: string;
  description?: ReactNode;
  action?: { label: string; onClick: () => void };
  className?: string;
}

/** Persistent, inline banner-style alert — for page-level states (errors, warnings), not toasts. */
export function InlineAlert({ type, title, description, action, className }: InlineAlertProps) {
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  return (
    <div className={cn("flex items-start gap-3 rounded-xl border p-4", config.className, className)}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="flex flex-1 flex-col gap-1">
        <p className="text-sm font-semibold">{title}</p>
        {description && <div className="text-sm opacity-90">{description}</div>}
      </div>
      {action && (
        <Button variant="outline" size="sm" className="shrink-0 bg-white/50" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
