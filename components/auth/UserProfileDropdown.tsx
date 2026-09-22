"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, LogOut, ShieldCheck } from "lucide-react";
import { RoleBadge } from "@/components/auth/RoleBadge";
import { RoleSwitcher } from "@/components/auth/RoleSwitcher";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAccessiblePages, useAuth } from "@/lib/auth/hooks";
import { PAGE_LABELS, ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/auth/roles";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Header menu: profile, role switcher (demo), accessible pages and logout. */
export function UserProfileDropdown() {
  const { user, role, logout } = useAuth();
  const accessiblePages = useAccessiblePages();
  const [open, setOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!user || !role) return null;

  return (
    <div ref={containerRef} className="relative ml-1 border-l border-border pl-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded-lg p-1 transition-all duration-200 hover:-translate-y-px hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <span
          aria-hidden
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
        >
          {initials(user.name)}
        </span>
        <span className="hidden min-w-0 flex-col items-start gap-0.5 leading-tight md:flex">
          <span className="max-w-32 truncate text-sm font-medium text-foreground">{user.name}</span>
          <RoleBadge role={role} />
        </span>
        <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" aria-hidden />
        <span className="sr-only">Account menu, role {ROLE_LABELS[role]}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="animate-slide-down absolute right-0 z-50 mt-2 flex w-80 max-w-[calc(100vw-2rem)] origin-top-right flex-col gap-3 rounded-xl bg-popover p-3 text-popover-foreground shadow-lg ring-1 ring-foreground/10"
        >
          <section aria-label="Profile" className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold text-foreground">{user.name}</span>
              <RoleBadge role={role} />
            </div>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            {user.department && <span className="text-xs text-muted-foreground">Department: {user.department}</span>}
          </section>

          <RoleSwitcher />

          <Button
            variant="outline"
            className="justify-start gap-2"
            onClick={() => {
              setOpen(false);
              setPermissionsOpen(true);
            }}
          >
            <ShieldCheck />
            {accessiblePages.length} pages disponibles
          </Button>

          <Button variant="outline" onClick={() => void logout()} className="justify-start gap-2">
            <LogOut />
            Logout
          </Button>
        </div>
      )}

      <Dialog open={permissionsOpen} onOpenChange={setPermissionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mes permissions — {ROLE_LABELS[role]}</DialogTitle>
            <DialogDescription>{ROLE_DESCRIPTIONS[role]}</DialogDescription>
          </DialogHeader>
          <ul className="mt-4 flex flex-col gap-1.5">
            {accessiblePages.map((page) => (
              <li key={page} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm text-foreground">
                {PAGE_LABELS[page]}
                <Check className="h-4 w-4 text-emerald-700 dark:text-emerald-300" aria-label="Accessible" />
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
}
