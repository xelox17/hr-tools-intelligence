"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LibraryBig, Menu, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/catalog", label: "Catalog", icon: LibraryBig },
  { href: "/insights", label: "AI Insights", icon: Sparkles },
];

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

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
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
          <aside className="relative flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
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
