"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LibraryBig, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/catalog", label: "Catalog", icon: LibraryBig },
  { href: "/insights", label: "AI Insights", icon: Sparkles },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-6 py-6">
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

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
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

      <div className="border-t border-sidebar-border px-6 py-4 text-xs text-sidebar-foreground/50">
        <p>Anas Mehri</p>
        <p>ESAIP Angers — 2026</p>
      </div>
    </aside>
  );
}
