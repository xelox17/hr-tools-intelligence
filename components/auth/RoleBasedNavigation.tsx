"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, findActiveHref } from "@/lib/auth/nav-items";
import { getAccessiblePages } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

/**
 * Sidebar navigation: exactly the pages the role can open, nothing else — no
 * locked, greyed-out or "coming soon" entries. A page that is not listed is a
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
  const items = useMemo(() => getAccessiblePages(userRole).map((page) => NAV_ITEMS[page]), [userRole]);
  const activeHref = findActiveHref(pathname, items);

  return (
    <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === activeHref;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
});
