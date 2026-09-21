import {
  Banknote,
  Briefcase,
  FileText,
  KeyRound,
  LayoutDashboard,
  LibraryBig,
  ScrollText,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PAGE_LABELS, PAGE_ROUTES } from "./roles";
import type { PageKey } from "./types";

export interface NavItem {
  page: PageKey;
  href: string;
  label: string;
  icon: LucideIcon;
}

const PAGE_ICONS: Record<PageKey, LucideIcon> = {
  CATALOG: LibraryBig,
  DASHBOARD: LayoutDashboard,
  RECRUITMENT: Briefcase,
  POLICIES: FileText,
  TEAM: Users,
  PAYROLL: Banknote,
  SETTINGS: Settings,
  API_KEYS: KeyRound,
  AUDIT_LOGS: ScrollText,
};

/** Navigation entry of every protected page. The sidebar shows only the ones a role can open. */
export const NAV_ITEMS: Record<PageKey, NavItem> = Object.fromEntries(
  (Object.keys(PAGE_ROUTES) as PageKey[]).map((page) => [
    page,
    { page, href: PAGE_ROUTES[page], label: PAGE_LABELS[page], icon: PAGE_ICONS[page] },
  ])
) as Record<PageKey, NavItem>;

// href -> label for the header breadcrumbs, including pages that are reached
// from the Home hub rather than from the sidebar.
export const NAV_LABELS: Record<string, string> = {
  ...Object.fromEntries(Object.values(NAV_ITEMS).map((item) => [item.href, item.label])),
  "/dashboard/ai-assistant": "AI Assistant",
  "/dashboard/health": "Health",
  "/dashboard/alerts": "Alerts",
  "/dashboard/integrations": "Integrations",
  "/dashboard/exports": "Exports",
  "/insights": "AI Insights",
  "/api-docs": "API Docs",
  "/error/unauthorized": "Access denied",
};

/** The sidebar entry whose href is the longest prefix of `pathname`. */
export function findActiveHref(pathname: string, items: NavItem[]): string | undefined {
  return items
    .filter(({ href }) => (href === PAGE_ROUTES.DASHBOARD ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}
