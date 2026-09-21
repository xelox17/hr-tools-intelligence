"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { RoleBasedNavigation } from "@/components/auth/RoleBasedNavigation";
import { useAuth } from "@/lib/auth/hooks";
import { LESAFFRE_THEME } from "@/lib/config/branding";

/** The logo doubles as the link to Home, the hub for the tools that are not role-specific. */
function Logo({ priority = false, onNavigate }: { priority?: boolean; onNavigate?: () => void }) {
  return (
    <Link href="/" onClick={onNavigate} aria-label="Home" className="flex flex-col gap-1.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-sidebar-ring/50">
      <BrandLogo className="w-32" priority={priority} />
      <span className="px-0.5 font-heading text-xs font-semibold text-sidebar-foreground/70">
        {LESAFFRE_THEME.productName}
      </span>
    </Link>
  );
}

function Footer() {
  return (
    <div className="border-t border-sidebar-border px-6 py-4 text-xs text-sidebar-foreground/60">
      <p>Anas Mehri</p>
      <p>ESAIP Angers — 2026</p>
    </div>
  );
}

/** Navigation for the signed-in role (the sidebar is only rendered once a user exists). */
function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const { role } = useAuth();
  if (!role) return <div className="flex-1" />;
  return <RoleBasedNavigation userRole={role} onNavigate={onNavigate} />;
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <header className="flex shrink-0 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-2 md:hidden">
        <Link href="/" aria-label="Home">
          <BrandLogo className="w-24" priority />
        </Link>
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
              <Logo onNavigate={() => setMobileOpen(false)} />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Navigation onNavigate={() => setMobileOpen(false)} />
            <Footer />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="px-6 py-6">
          <Logo priority />
        </div>
        <Navigation />
        <Footer />
      </aside>
    </>
  );
}
