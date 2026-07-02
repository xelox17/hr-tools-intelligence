import type { ToolScope } from "@/lib/types";

const CATEGORY_COLORS: Record<string, string> = {
  HRIS: "#0A1F44",
  Recruitment: "#00A88E",
  Learning: "#3B82C4",
  Payroll: "#E3A23C",
  Communication: "#8B5FBF",
  "Time & Attendance": "#2FA8C4",
  Onboarding: "#D9636C",
  Wellness: "#D97BAE",
  Mobility: "#6B7A99",
  "HR Support": "#5B6ECF",
  Analytics: "#C98A3E",
};

const FALLBACK_COLOR = "#94A3B8";

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? FALLBACK_COLOR;
}

export const SCOPE_COLORS: Record<ToolScope, string> = {
  Corporate: "#0A1F44",
  Local: "#00A88E",
};
