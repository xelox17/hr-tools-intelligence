import { ExternalLink, KeyRound, ScrollText, Settings, type LucideIcon } from "lucide-react";
import { AccessGate } from "@/components/auth/AccessGate";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE_URL } from "@/lib/api";
import type { PageKey } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

/**
 * Settings, API Keys and Audit Logs are admin-only infrastructure pages
 * (CORS/rate-limit/webhook config, key issuance, full audit trail) that stay
 * on the Vercel-hosted app for now — porting their full UI here wasn't part
 * of this pass. Each stub links straight to the equivalent page there.
 */
function ExternalPageStub({
  page,
  path,
  title,
  description,
  icon: Icon,
}: {
  page: PageKey;
  path: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <AccessGate page={page}>
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="font-heading text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </header>
        <Card className="border-dashed border-border">
          <CardHeader>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <CardTitle>Available on the full platform</CardTitle>
            <CardDescription>This admin area isn't ported to the code app yet — open it on the Vercel-hosted portal.</CardDescription>
          </CardHeader>
          <CardContent>
            <a href={`${API_BASE_URL}${path}`} target="_blank" rel="noreferrer" className={cn(buttonVariants(), "gap-2")}>
              Open {title}
              <ExternalLink className="h-4 w-4" />
            </a>
          </CardContent>
        </Card>
      </div>
    </AccessGate>
  );
}

export function SettingsPage() {
  return (
    <ExternalPageStub page="SETTINGS" path="/settings" title="Settings" description="Security, rate limits, CORS and webhooks." icon={Settings} />
  );
}

export function ApiKeysPage() {
  return (
    <ExternalPageStub page="API_KEYS" path="/api-keys" title="API Keys" description="Issue and revoke API keys." icon={KeyRound} />
  );
}

export function AuditLogsPage() {
  return (
    <ExternalPageStub page="AUDIT_LOGS" path="/audit-logs" title="Audit Logs" description="Full audit trail of access and changes." icon={ScrollText} />
  );
}
