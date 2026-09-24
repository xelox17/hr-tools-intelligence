import { Banknote, Briefcase, Building2, GraduationCap, ScrollText, type LucideIcon } from "lucide-react";

export interface CategoryMeta {
  icon: LucideIcon;
  /** Left-border accent on cards. */
  border: string;
  /** Small filter-button / category badge. */
  badge: string;
}

/** Keyed by the HR sub-category (Recruitment/Learning/Corporate/Payroll) — every tool here is "Human Resources" at the top level, so that no longer distinguishes anything. */
export const CATEGORY_META: Record<string, CategoryMeta> = {
  Recruitment: {
    icon: Briefcase,
    border: "border-l-emerald-500",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  Learning: {
    icon: GraduationCap,
    border: "border-l-sky-500",
    badge: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  },
  Corporate: {
    icon: Building2,
    border: "border-l-violet-500",
    badge: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
  },
  Payroll: {
    icon: Banknote,
    border: "border-l-amber-500",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  },
};

export const DEFAULT_CATEGORY_META: CategoryMeta = {
  icon: ScrollText,
  border: "border-l-border",
  badge: "bg-muted text-muted-foreground",
};

export function getCategoryMeta(subcategory: string | undefined): CategoryMeta {
  return (subcategory ? CATEGORY_META[subcategory] : undefined) ?? DEFAULT_CATEGORY_META;
}
