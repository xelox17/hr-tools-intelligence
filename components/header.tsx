"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertOctagon, AlertTriangle, Bell, ChevronRight, Info, Menu, Moon, ShieldCheck, ShieldOff, Sun } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Badge } from "@/components/ui/badge";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useNotifications } from "@/hooks/useNotifications";
import { useAdminToken } from "@/hooks/useAdminToken";
import { usePermission } from "@/lib/auth/hooks";
import { NAV_LABELS } from "@/lib/auth/nav-items";
import { UserProfileDropdown } from "@/components/auth/UserProfileDropdown";
import { cn } from "@/lib/utils";

const SEVERITY_ICON = { critical: AlertOctagon, warning: AlertTriangle, info: Info } as const;

// "/dashboard" is labeled "Overview" in the sidebar (to read well next to its
// siblings Health/Alerts/...), but that reads oddly as a non-terminal
// breadcrumb — override it to the section name there instead.
const BREADCRUMB_SECTION_LABELS: Record<string, string> = { "/dashboard": "Dashboard" };

function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return <span className="text-sm font-medium text-foreground">Home</span>;
  }

  const crumbs = segments.reduce<{ href: string; label: string }[]>((acc, segment) => {
    const href = `${acc[acc.length - 1]?.href ?? ""}/${segment}`;
    const isLast = href === pathname;
    const label =
      (!isLast && BREADCRUMB_SECTION_LABELS[href]) ||
      NAV_LABELS[href] ||
      segment.charAt(0).toUpperCase() + segment.slice(1);
    return [...acc, { href, label }];
  }, []);

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
      <Link href="/" className="shrink-0 text-muted-foreground hover:text-foreground">
        Home
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex min-w-0 items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
          {i === crumbs.length - 1 ? (
            <span className="truncate font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="truncate text-muted-foreground hover:text-foreground">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

function ThemeToggle() {
  const { isDark, mounted, toggle } = useDarkMode();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mounted && isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 hover:-translate-y-px hover:bg-muted hover:text-foreground"
    >
      {mounted && isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function NotificationBell() {
  const { alerts, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) markAllRead();
        }}
        aria-label="Notifications"
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 hover:-translate-y-px hover:bg-muted hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[0.625rem] font-bold text-white dark:text-background">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="animate-slide-down absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-xl bg-popover p-2 text-popover-foreground shadow-lg ring-1 ring-foreground/10">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-sm font-semibold text-foreground">Active alerts</span>
            <Link href="/dashboard/alerts" className="text-xs text-accent link-underline" onClick={() => setOpen(false)}>
              View all
            </Link>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">No active alerts.</p>
            ) : (
              alerts.slice(0, 8).map((alert) => {
                const Icon = SEVERITY_ICON[alert.severity] ?? Info;
                return (
                  <div key={alert.id} className="flex gap-2 rounded-lg px-2 py-2 hover:bg-muted">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-foreground">{alert.rule}</span>
                      <span className="truncate text-xs text-muted-foreground">{alert.message}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Admin-token shortcut to Settings: only rendered for roles that can open Settings. */
function AdminStatus() {
  const { hasToken } = useAdminToken();
  const canOpenSettings = usePermission("SETTINGS", "view");
  if (!canOpenSettings) return null;

  return (
    <Link
      href="/settings"
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-200 hover:-translate-y-px hover:bg-muted",
        hasToken ? "text-foreground" : "text-muted-foreground"
      )}
      title={hasToken ? "Admin token set" : "No admin token — click to add one"}
    >
      {hasToken ? <ShieldCheck className="h-3.5 w-3.5 text-accent" /> : <ShieldOff className="h-3.5 w-3.5" />}
      <span className="hidden xl:inline">{hasToken ? "Admin" : "Not connected"}</span>
      {hasToken && <Badge variant="success" size="sm" className="hidden 2xl:inline-flex">connected</Badge>}
    </Link>
  );
}

/**
 * Single top bar. Below lg (phones and tablets) it also carries the menu button and
 * the logo, because the sidebar becomes a drawer. The breadcrumb needs room, so it
 * only appears from sm up (every page has its own heading anyway).
 *
 * `relative z-30`: an explicit stacking context, so the notification/profile
 * dropdowns (both z-50 *within* it) always paint above page content — any
 * animated/transformed element in <main> (a card's hover lift, the page
 * fade-in) can otherwise end up promoted to its own layer and land on top of
 * a z-50 descendant that has no stacking context of its own at the header
 * level. Below the mobile drawer's z-50 so it can still cover the header.
 */
export function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-sm sm:gap-3 sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <div className="flex shrink-0 items-center gap-1.5 lg:hidden">
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-all duration-200 hover:-translate-y-px hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" aria-label="Home" className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <BrandLogo className="w-16" priority />
          </Link>
        </div>
        <div className="hidden min-w-0 flex-1 sm:block">
          <Breadcrumbs />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <AdminStatus />
        <NotificationBell />
        <ThemeToggle />
        <UserProfileDropdown />
      </div>
    </header>
  );
}
