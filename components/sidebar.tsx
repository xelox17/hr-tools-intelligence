"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Code2,
  Download,
  Home,
  KeyRound,
  LayoutDashboard,
  LibraryBig,
  Menu,
  Plug,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavLeaf {
  href: string;
  label: string;
  icon: typeof Home;
}

interface NavGroup {
  label: string;
  icon: typeof Home;
  items: NavLeaf[];
}

const TOP_ITEMS: NavLeaf[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/catalog", label: "Catalog", icon: LibraryBig },
  { href: "/insights", label: "AI Insights", icon: Sparkles },
];

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/health", label: "Health", icon: Stethoscope },
      { href: "/dashboard/alerts", label: "Alerts", icon: Bell },
      { href: "/dashboard/integrations", label: "Integrations", icon: Plug },
      { href: "/dashboard/exports", label: "Exports", icon: Download },
    ],
  },
  {
    label: "Admin",
    icon: ShieldCheck,
    items: [
      { href: "/dashboard/api-keys", label: "API Keys", icon: KeyRound },
      { href: "/dashboard/admin/settings", label: "Settings", icon: Settings },
      { href: "/dashboard/audit", label: "Audit Logs", icon: ScrollText },
    ],
  },
];

const TRAILING_ITEMS: NavLeaf[] = [{ href: "/api-docs", label: "API Docs", icon: Code2 }];

const ALL_LEAVES: NavLeaf[] = [...TOP_ITEMS, ...NAV_GROUPS.flatMap((g) => g.items), ...TRAILING_ITEMS];

// Flattened href -> label map, consumed by components/header.tsx to render
// breadcrumbs without duplicating this nav structure.
export const NAV_LABELS: Record<string, string> = Object.fromEntries(
  ALL_LEAVES.map((item) => [item.href, item.label])
);

function useActiveHref(): string | undefined {
  const pathname = usePathname();
  return [...ALL_LEAVES]
    .filter(({ href }) => (href === "/" ? pathname === "/" : pathname.startsWith(href)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-heading text-sm font-bold">HR Tools</span>
        <span className="font-heading text-sm font-bold text-sidebar-primary">
          Intelligence
        </span>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="border-t border-sidebar-border px-6 py-4 text-xs text-sidebar-foreground/50">
      <p>Anas Mehri</p>
      <p>ESAIP Angers — 2026</p>
    </div>
  );
}

function NavLeafLink({ item, active, onNavigate }: { item: NavLeaf; active: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
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

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const activeHref = useActiveHref();

  return (
    <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-2">
      <div className="flex flex-col gap-1">
        {TOP_ITEMS.map((item) => (
          <NavLeafLink key={item.href} item={item} active={item.href === activeHref} onNavigate={onNavigate} />
        ))}
      </div>

      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <span className="px-3 text-[0.6875rem] font-semibold tracking-wider text-sidebar-foreground/40 uppercase">
            {group.label}
          </span>
          {group.items.map((item) => (
            <NavLeafLink key={item.href} item={item} active={item.href === activeHref} onNavigate={onNavigate} />
          ))}
        </div>
      ))}

      <div className="flex flex-col gap-1">
        {TRAILING_ITEMS.map((item) => (
          <NavLeafLink key={item.href} item={item} active={item.href === activeHref} onNavigate={onNavigate} />
        ))}
      </div>
    </nav>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <header className="flex shrink-0 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3 md:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-72 flex-col bg-sidebar text-sidebar-foreground">
            <div className="flex items-center justify-between px-6 py-6">
              <Logo />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <NavLinks onNavigate={() => setMobileOpen(false)} />
            <Footer />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden h-full w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="px-6 py-6">
          <Logo />
        </div>
        <NavLinks />
        <Footer />
      </aside>
    </>
  );
}
