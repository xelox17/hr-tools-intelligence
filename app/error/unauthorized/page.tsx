"use client";

import Link from "next/link";
import { Ban, Check } from "lucide-react";
import { RoleBadge } from "@/components/auth/RoleBadge";
import { buttonVariants } from "@/components/ui/button";
import { useAccessiblePages, useAuth } from "@/lib/auth/hooks";
import { PAGE_LABELS, PAGE_ROUTES } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

/**
 * Where the proxy sends a signed-in user who opens a page their role cannot
 * use. It says what they CAN open, and the attempt has already been audited.
 */
export default function UnauthorizedPage() {
  const { role } = useAuth();
  const accessiblePages = useAccessiblePages();

  return (
    <div role="alert" className="permission-denied mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-card text-destructive ring-1 ring-destructive/30">
        <Ban className="h-6 w-6" aria-hidden />
      </div>
      <h1 className="font-heading text-xl font-bold text-foreground">Accès refusé</h1>
      <p className="text-sm text-muted-foreground">Vous n&apos;avez pas accès à cette page.</p>

      {role && (
        <div className="flex w-full flex-col items-center gap-2">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            En tant que <RoleBadge role={role} />, vous pouvez accéder à :
          </p>
          <ul className="flex flex-wrap justify-center gap-2">
            {accessiblePages.map((page) => (
              <li key={page}>
                <Link
                  href={PAGE_ROUTES[page]}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <Check className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-300" aria-hidden />
                  {PAGE_LABELS[page]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Si vous pensez que c&apos;est une erreur, contactez l&apos;administrateur.
      </p>
      <Link href="/dashboard" className={cn(buttonVariants())}>
        Retour au Dashboard
      </Link>
    </div>
  );
}
