import {
  Banknote,
  Bot,
  Briefcase,
  Download,
  FileText,
  Home,
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
  HOME: Home,
  CATALOG: LibraryBig,
  AI_ASSISTANT: Bot,
  EXPORTS: Download,
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

// href -> label for the header breadcrumbs, including pages reached from
// elsewhere than the sidebar.
export const NAV_LABELS: Record<string, string> = {
  ...Object.fromEntries(Object.values(NAV_ITEMS).map((item) => [item.href, item.label])),
  "/error/unauthorized": "Access denied",
};

// "/" would prefix every path.
const EXACT_HREFS = [PAGE_ROUTES.HOME, PAGE_ROUTES.DASHBOARD];

/** The sidebar entry whose href is the longest prefix of `pathname`. */
export function findActiveHref(pathname: string, items: NavItem[]): string | undefined {
  return items
    .filter(({ href }) => (EXACT_HREFS.includes(href) ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}
