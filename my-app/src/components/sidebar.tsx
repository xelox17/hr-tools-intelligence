import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bot, Home, LibraryBig, Settings, X, type LucideIcon } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/lib/auth/hooks";
import { LESAFFRE_THEME } from "@/lib/config/branding";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Also active for a sub-route (e.g. a tool detail page under /catalog). */
  matchPrefix?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/catalog", label: "Catalog", icon: LibraryBig, matchPrefix: true },
  { href: "/ai-assistant", label: "AI Assistant", icon: Bot },
];

/** PDD's Admin RH persona (§3): only ADMIN sees this — everyone else has no way to reach /admin from the UI (the route itself also redirects them away). */
const ADMIN_NAV_ITEM: NavItem = { href: "/admin", label: "Admin", icon: Settings };

/** The logo doubles as the link to Home. */
function Logo({ priority = false, onNavigate }: { priority?: boolean; onNavigate?: () => void }) {
  return (
    <Link to="/" onClick={onNavigate} aria-label="Home" className="flex flex-col gap-1.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-sidebar-ring/50">
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

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const { role } = useAuth();
  const items = role === "ADMIN" ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;
  return (
    <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
      {items.map((item) => {
        const active = item.matchPrefix
          ? pathname === item.href || pathname.startsWith(`${item.href}/`)
          : pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            to={item.href}
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
      })}
    </nav>
  );
}

/**
 * Fixed sidebar from lg (1024px) up. Below that it is a slide-in drawer opened from the
 * menu button in the header, so phones and tablets keep the full width for content.
 */
export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="animate-fade-in absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
          <aside
            aria-label="Menu"
            className="animate-fade-in relative flex h-full w-72 max-w-[85vw] flex-col bg-sidebar text-sidebar-foreground shadow-xl"
          >
            <div className="flex items-center justify-between px-6 py-6">
              <Logo onNavigate={onClose} />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-all duration-200 hover:-translate-y-px hover:bg-sidebar-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Navigation onNavigate={onClose} />
            <Footer />
          </aside>
        </div>
      )}

      <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <div className="px-6 py-6">
          <Logo priority />
        </div>
        <Navigation />
        <Footer />
      </aside>
    </>
  );
}
