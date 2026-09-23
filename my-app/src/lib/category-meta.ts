import {
  Cpu,
  FlaskConical,
  Factory,
  LifeBuoy,
  Megaphone,
  ScrollText,
  ShieldCheck,
  TrendingUp,
  Users,
  Users2,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface CategoryMeta {
  icon: LucideIcon;
  /** Left-border accent on cards. */
  border: string;
  /** Small filter-button / category badge. */
  badge: string;
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  "Human Resources": {
    icon: Users,
    border: "border-l-emerald-500",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  Collaboration: {
    icon: Users2,
    border: "border-l-blue-500",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
  },
  Communication: {
    icon: Megaphone,
    border: "border-l-purple-500",
    badge: "bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300",
  },
  "Digital & Technology": {
    icon: Cpu,
    border: "border-l-violet-500",
    badge: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
  },
  Finance: {
    icon: Wallet,
    border: "border-l-sky-500",
    badge: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  },
  "GRC + Legal": {
    icon: ShieldCheck,
    border: "border-l-amber-500",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  },
  "Production & Operations": {
    icon: Factory,
    border: "border-l-rose-500",
    badge: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
  },
  "R&D & Innovation": {
    icon: FlaskConical,
    border: "border-l-teal-500",
    badge: "bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-300",
  },
  "Sales & Business Development": {
    icon: TrendingUp,
    border: "border-l-orange-500",
    badge: "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300",
  },
  "Workplace & Support": {
    icon: LifeBuoy,
    border: "border-l-slate-500",
    badge: "bg-slate-100 text-slate-800 dark:bg-slate-500/15 dark:text-slate-300",
  },
};

export const DEFAULT_CATEGORY_META: CategoryMeta = {
  icon: ScrollText,
  border: "border-l-border",
  badge: "bg-muted text-muted-foreground",
};

export function getCategoryMeta(category: string): CategoryMeta {
  return CATEGORY_META[category] ?? DEFAULT_CATEGORY_META;
}
