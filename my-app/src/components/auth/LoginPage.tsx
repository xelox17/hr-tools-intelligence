import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrandLogo } from "@/components/brand-logo";
import { RoleBadge } from "@/components/auth/RoleBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/hooks";
import { DEMO_USERS } from "@/lib/auth/demo-users";
import { ROLE_DESCRIPTIONS } from "@/lib/auth/roles";

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleLogin(userId: string) {
    setError(null);
    setPendingId(userId);
    const result = await login(userId);
    setPendingId(null);
    if (result.ok) navigate("/");
    else setError(result.error ? `Sign-in failed: ${result.error}` : "Sign-in is unavailable right now. Please try again later.");
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col items-center gap-4 text-center">
        <BrandLogo className="w-36" priority />
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Sign in to the HR portal</h1>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground">
            Demo mode: pick an account to explore the tool catalog. No password is needed here; in production, sign-in goes through the company SSO.
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
                <div className="mt-auto">
                  <Button size="lg" onClick={() => void handleLogin(demoUser.id)} disabled={pendingId === demoUser.id}>
                    {pendingId === demoUser.id ? "Signing in…" : `Sign in as ${demoUser.name.split(" ")[0]}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
