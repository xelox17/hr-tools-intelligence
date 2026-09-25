import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Menu, Moon, Sun } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useDarkMode } from "@/hooks/useDarkMode";
import { UserProfileDropdown } from "@/components/auth/UserProfileDropdown";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const BREADCRUMB_LABEL_KEYS: Record<string, string> = {
  "/catalog": "nav.catalog",
  "/ai-assistant": "nav.aiAssistant",
  "/admin": "nav.admin",
};

function Breadcrumbs() {
  const { pathname } = useLocation();
  const { t } = useLanguage();
  if (pathname === "/") return <span className="text-sm font-medium text-foreground">{t("nav.home")}</span>;

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.reduce<{ href: string; label: string }[]>((acc, segment) => {
    const href = `${acc[acc.length - 1]?.href ?? ""}/${segment}`;
    const key = BREADCRUMB_LABEL_KEYS[href];
    const label = key ? t(key) : segment.charAt(0).toUpperCase() + segment.slice(1);
    return [...acc, { href, label }];
  }, []);

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
      <Link to="/" className="shrink-0 text-muted-foreground hover:text-foreground">
        {t("nav.home")}
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex min-w-0 items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
          {i === crumbs.length - 1 ? (
            <span className="truncate font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link to={crumb.href} className="truncate text-muted-foreground hover:text-foreground">
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

/**
 * Single top bar; `relative z-30` keeps its dropdowns above page content
 * (an animated page wrapper can otherwise form its own stacking context and
 * paint over a dropdown that has no ancestor stacking context of its own).
 * The logo only appears here on mobile (< lg), where the sidebar is a
 * closed drawer — desktop already shows it at the top of the sidebar.
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
          <Link to="/" aria-label="Home" className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <BrandLogo className="w-16" priority />
          </Link>
        </div>
        <div className="hidden min-w-0 flex-1 sm:block">
          <Breadcrumbs />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
        <UserProfileDropdown />
      </div>
    </header>
  );
}
