import { useEffect } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { RoleBasedNavigation } from "@/components/auth/RoleBasedNavigation";
import { useAuth } from "@/lib/auth/hooks";
import { LESAFFRE_THEME } from "@/lib/config/branding";

/** The logo doubles as the link to Home, the hub for the tools that are not role-specific. */
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

/** Navigation for the signed-in role (the sidebar is only rendered once a user exists). */
function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const { role } = useAuth();
  if (!role) return <div className="flex-1" />;
  return <RoleBasedNavigation userRole={role} onNavigate={onNavigate} />;
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
