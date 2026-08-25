export type AlertSeverity = "critical" | "warning" | "info";

export interface AlertColorClasses {
  bg: string;
  border: string;
  text: string;
  badge: string;
}

const ALERT_COLORS: Record<AlertSeverity, AlertColorClasses> = {
  critical: {
    bg: "bg-red-100",
    border: "border-red-500",
    text: "text-red-900",
    badge: "bg-red-100 text-red-800 border-red-300",
  },
  warning: {
    bg: "bg-yellow-100",
    border: "border-yellow-500",
    text: "text-yellow-900",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  info: {
    bg: "bg-blue-100",
    border: "border-blue-500",
    text: "text-blue-900",
    badge: "bg-blue-100 text-blue-800 border-blue-300",
  },
};

export function getAlertColorClasses(severity: string): AlertColorClasses {
  return ALERT_COLORS[severity as AlertSeverity] ?? ALERT_COLORS.info;
}
