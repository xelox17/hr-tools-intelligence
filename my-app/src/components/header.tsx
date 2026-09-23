import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useDarkMode } from "@/hooks/useDarkMode";
import { UserProfileDropdown } from "@/components/auth/UserProfileDropdown";
import { useAuth } from "@/lib/auth/hooks";

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
 * (see the Next.js app's commit fixing exactly this: an animated page
 * wrapper can otherwise form its own stacking context and paint over a
 * dropdown that has no ancestor stacking context of its own).
 */
export function Header() {
  const { user } = useAuth();
  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-sm sm:gap-3 sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <Link to="/catalog" aria-label="HR Tools Portal" className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <BrandLogo className="w-9" priority />
          <span className="hidden font-heading text-sm font-semibold text-foreground sm:inline">HR Tools Portal</span>
        </Link>
        {user && <span className="hidden truncate text-sm text-muted-foreground md:inline">Welcome, {user.name.split(" ")[0]}</span>}
      </div>
      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <ThemeToggle />
        <UserProfileDropdown />
      </div>
    </header>
  );
}
