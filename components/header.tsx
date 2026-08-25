"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertOctagon, AlertTriangle, Bell, ChevronRight, Info, Moon, ShieldCheck, ShieldOff, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useNotifications } from "@/hooks/useNotifications";
import { useAdminToken } from "@/hooks/useAdminToken";
import { NAV_LABELS } from "@/components/sidebar";
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
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[0.625rem] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl bg-popover p-2 text-popover-foreground shadow-lg ring-1 ring-foreground/10">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-sm font-semibold text-foreground">Active alerts</span>
            <Link href="/dashboard/alerts" className="text-xs text-accent hover:underline" onClick={() => setOpen(false)}>
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

function AdminStatus() {
  const { hasToken } = useAdminToken();
  return (
    <Link
      href="/dashboard/admin/settings"
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted",
        hasToken ? "text-foreground" : "text-muted-foreground"
      )}
      title={hasToken ? "Admin token set" : "No admin token — click to add one"}
    >
      {hasToken ? <ShieldCheck className="h-3.5 w-3.5 text-accent" /> : <ShieldOff className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{hasToken ? "Admin" : "Not connected"}</span>
      {hasToken && <Badge variant="success" size="sm" className="hidden sm:inline-flex">connected</Badge>}
    </Link>
  );
}

export function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-sm sm:px-6 md:px-8">
      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <AdminStatus />
        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  );
}
