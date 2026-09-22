"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, findActiveHref, type NavItem } from "@/lib/auth/nav-items";
import { UNIVERSAL_PAGES, getAccessiblePages } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}

/**
 * Sidebar navigation: the universal pages (Home, Catalog, AI Assistant) first,
 * a separator, then exactly the role-dependent pages the role can open. No
 * locked, greyed-out or "coming soon" entries: a page that is not listed is a
 * page the role does not have (and the server refuses it anyway).
 */
export const RoleBasedNavigation = memo(function RoleBasedNavigation({
  userRole,
  onNavigate,
}: {
  userRole: UserRole;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { universal, restricted } = useMemo(() => {
    const items = getAccessiblePages(userRole).map((page) => NAV_ITEMS[page]);
    return {
      universal: items.filter((item) => UNIVERSAL_PAGES.includes(item.page)),
      restricted: items.filter((item) => !UNIVERSAL_PAGES.includes(item.page)),
    };
  }, [userRole]);
  const activeHref = findActiveHref(pathname, [...universal, ...restricted]);

  return (
    <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
      {universal.map((item) => (
        <NavLink key={item.href} item={item} active={item.href === activeHref} onNavigate={onNavigate} />
      ))}
      {restricted.length > 0 && <div role="separator" className="my-2 h-px shrink-0 bg-sidebar-border" />}
      {restricted.map((item) => (
        <NavLink key={item.href} item={item} active={item.href === activeHref} onNavigate={onNavigate} />
      ))}
    </nav>
  );
});
