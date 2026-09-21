"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { PermissionIndicator } from "@/components/auth/PermissionIndicator";
import { RoleBadge } from "@/components/auth/RoleBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth/hooks";
import { DEMO_USERS } from "@/lib/auth/demo-users";
import { PAGE_LABELS, ROLE_DESCRIPTIONS, ROLE_LABELS, getAccessiblePages, getPermissionLevel, listPermissions } from "@/lib/auth/roles";
import type { User } from "@/lib/auth/types";

function PermissionsDialog({ user }: { user: User }) {
  return (
    <Dialog>
      <DialogTrigger className={buttonVariants({ variant: "outline", size: "sm" })}>
        <ShieldCheck />
        Permissions
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{ROLE_LABELS[user.role]} permissions</DialogTitle>
          <DialogDescription>{ROLE_DESCRIPTIONS[user.role]}</DialogDescription>
        </DialogHeader>
        <ul className="mt-4 flex max-h-96 flex-col gap-2 overflow-y-auto">
          {getAccessiblePages(user.role).map((page) => {
            const granted = listPermissions(user.role, page)
              .filter((permission) => permission.allowed && permission.action !== "view")
              .map((permission) => permission.action);
            return (
              <li key={page} className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{PAGE_LABELS[page]}</span>
                  <span className="text-xs text-muted-foreground">{granted.length > 0 ? granted.join(", ") : "—"}</span>
                </div>
                <PermissionIndicator level={getPermissionLevel(user.role, page)} showLabel />
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

export function LoginPage() {
  const { login, user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  // A full navigation, so the server renders the app again with the new session cookie.
  async function handleLogin(userId: string) {
    setError(null);
    if (await login(userId)) window.location.assign("/catalog");
    else setError("Sign-in is unavailable right now. Please try again later.");
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col items-center gap-4 text-center">
        <BrandLogo className="w-36" priority />
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Sign in to the HR portal</h1>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground">
            Demo mode: pick an account to explore what each role can see and do. No password is needed here; in production, sign-in goes through the company SSO.
          </p>
          {user && (
            <p className="text-xs text-muted-foreground">
              Currently signed in as <strong className="text-foreground">{user.name}</strong>.
            </p>
          )}
        </div>
      </header>

      {error && (
        <p role="alert" className="mx-auto rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_USERS.map((demoUser) => (
          <li key={demoUser.id}>
            <Card className="h-full">
              <CardContent className="flex h-full flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-heading text-base font-semibold text-foreground">{demoUser.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{demoUser.email}</span>
                  </div>
                  <RoleBadge role={demoUser.role} />
                </div>
                <p className="text-sm text-muted-foreground">{ROLE_DESCRIPTIONS[demoUser.role]}</p>
                <div className="mt-auto flex flex-wrap items-center gap-2">
                  <Button size="lg" onClick={() => handleLogin(demoUser.id)}>
                    Sign in as {demoUser.name.split(" ")[0]}
                  </Button>
                  <PermissionsDialog user={demoUser} />
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
