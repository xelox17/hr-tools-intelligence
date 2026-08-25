"use client";

import { useCallback, useEffect, useState } from "react";
import { Globe2, Plus, Shield, Sliders, Webhook as WebhookIcon, X } from "lucide-react";
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminTokenBar } from "@/components/admin/AdminTokenBar";
import { showAlert } from "@/components/ui/alert";
import { useAdminToken, authHeaders } from "@/hooks/useAdminToken";

interface SecuritySettings {
  rate_limit_enabled: boolean;
  rate_limit_public_per_minute: number;
  rate_limit_authenticated_per_minute: number;
  rate_limit_per_api_key_per_minute: number;
  cors_allowed_origins: string[];
  security_headers_enabled: boolean;
  updated_at: string | null;
  updated_by: string | null;
}

function isValidOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && url.pathname === "/";
  } catch {
    return false;
  }
}

export default function AdminSettingsPage() {
  const { token } = useAdminToken();
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [draft, setDraft] = useState<SecuritySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newOrigin, setNewOrigin] = useState("");
  const [testWebhookUrl, setTestWebhookUrl] = useState("");
  const [testingWebhook, setTestingWebhook] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", { headers: authHeaders(token) });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.error?.message ?? "Failed to load settings.");
      setSettings(body.data);
      setDraft(body.data);
    } catch (error) {
      showAlert({ type: "error", title: "Failed to load security settings", description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timeout = setTimeout(() => load(), 0);
    return () => clearTimeout(timeout);
  }, [load]);

  const dirty = draft && settings && JSON.stringify(draft) !== JSON.stringify(settings);

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({
          rate_limit_enabled: draft.rate_limit_enabled,
          rate_limit_public_per_minute: draft.rate_limit_public_per_minute,
          rate_limit_authenticated_per_minute: draft.rate_limit_authenticated_per_minute,
          rate_limit_per_api_key_per_minute: draft.rate_limit_per_api_key_per_minute,
          cors_allowed_origins: draft.cors_allowed_origins,
          security_headers_enabled: draft.security_headers_enabled,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.error?.message ?? "Failed to save settings.");
      setSettings(body.data);
      setDraft(body.data);
      showAlert({ type: "success", title: "Settings saved" });
    } catch (error) {
      showAlert({ type: "error", title: "Failed to save settings", description: (error as Error).message });
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setDraft(settings);
    setNewOrigin("");
  }

  function addOrigin() {
    if (!draft || !isValidOrigin(newOrigin)) return;
    if (draft.cors_allowed_origins.includes(newOrigin)) return;
    setDraft({ ...draft, cors_allowed_origins: [...draft.cors_allowed_origins, newOrigin] });
    setNewOrigin("");
  }

  function removeOrigin(origin: string) {
    if (!draft) return;
    setDraft({ ...draft, cors_allowed_origins: draft.cors_allowed_origins.filter((o) => o !== origin) });
  }

  async function testWebhook() {
    if (!testWebhookUrl.trim()) return;
    setTestingWebhook(true);
    try {
      const res = await fetch("/api/webhooks/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: testWebhookUrl.trim() }),
      });
      const body = await res.json();
      if (body.success) {
        showAlert({
          type: "success",
          title: "Webhook reachable",
          description: `Status ${body.statusCode} in ${body.responseTime}ms.`,
        });
      } else {
        showAlert({ type: "error", title: "Webhook test failed", description: body.error ?? "No response." });
      }
    } catch (error) {
      showAlert({ type: "error", title: "Webhook test failed", description: (error as Error).message });
    } finally {
      setTestingWebhook(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <AdminTokenBar />

      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Admin Settings</h1>
          <p className="text-sm text-muted-foreground">
            Rate limits, CORS, and security headers — enforced by proxy.ts on every request.
          </p>
        </div>
        {dirty && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        )}
      </header>

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : !draft ? (
        <Card className="border-dashed border-border">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Enter an admin token above to load settings.
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="security">
          <TabsList>
            <TabsIndicator />
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
            <TabsTrigger value="cors">CORS</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>

          <TabsContent value="security">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-accent" /> Security overview
                </CardTitle>
                <CardDescription>JWT and API key posture (read-only — set via environment variables).</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Security headers</p>
                    <p className="text-xs text-muted-foreground">
                      X-Content-Type-Options, X-Frame-Options, HSTS, CSP, X-XSS-Protection on every response.
                    </p>
                  </div>
                  <Switch
                    checked={draft.security_headers_enabled}
                    onCheckedChange={(checked) => setDraft({ ...draft, security_headers_enabled: checked })}
                  />
                </div>
                <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">JWT_SECRET</strong>: configured server-side; not exposed to
                    the browser. Rotating it invalidates every outstanding token.
                  </p>
                  <p className="mt-1">
                    <strong className="text-foreground">API key rotation policy</strong>: keys expire 90 days after
                    creation by default. Manage keys from the{" "}
                    <a href="/dashboard/api-keys" className="text-accent underline">
                      API Keys
                    </a>{" "}
                    page.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rate-limits">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-accent" /> Rate limits
                </CardTitle>
                <CardDescription>Requests per minute, per proxy.ts tier.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Enable rate limiting</span>
                  <Switch
                    checked={draft.rate_limit_enabled}
                    onCheckedChange={(checked) => setDraft({ ...draft, rate_limit_enabled: checked })}
                  />
                </div>

                {(
                  [
                    { key: "rate_limit_public_per_minute", label: "Public (per IP)", min: 10, max: 500 },
                    { key: "rate_limit_authenticated_per_minute", label: "Authenticated (per IP)", min: 100, max: 5000 },
                    { key: "rate_limit_per_api_key_per_minute", label: "Per API key", min: 50, max: 2000 },
                  ] as const
                ).map((row) => (
                  <div key={row.key} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{row.label}</span>
                      <span className="font-heading font-bold text-accent">
                        {draft[row.key]} req/min
                      </span>
                    </div>
                    <input
                      type="range"
                      min={row.min}
                      max={row.max}
                      step={10}
                      value={draft[row.key]}
                      onChange={(e) => setDraft({ ...draft, [row.key]: Number(e.target.value) })}
                      className="w-full accent-accent"
                      disabled={!draft.rate_limit_enabled}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cors">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe2 className="h-4 w-4 text-accent" /> Allowed origins
                </CardTitle>
                <CardDescription>Browsers calling this API from these origins get CORS headers.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <Input
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value)}
                    placeholder="https://example.com"
                    onKeyDown={(e) => e.key === "Enter" && addOrigin()}
                  />
                  <Button variant="outline" className="gap-1.5" onClick={addOrigin} disabled={!isValidOrigin(newOrigin)}>
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
                <div className="flex flex-col gap-2">
                  {draft.cors_allowed_origins.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No origins configured.</p>
                  ) : (
                    draft.cors_allowed_origins.map((origin) => (
                      <div
                        key={origin}
                        className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                      >
                        <span className="text-foreground">{origin}</span>
                        <button
                          type="button"
                          aria-label={`Remove ${origin}`}
                          onClick={() => removeOrigin(origin)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <WebhookIcon className="h-4 w-4 text-accent" /> Webhook delivery
                </CardTitle>
                <CardDescription>Test a URL&apos;s reachability, and the retry policy applied on delivery.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <Input
                    value={testWebhookUrl}
                    onChange={(e) => setTestWebhookUrl(e.target.value)}
                    placeholder="https://example.com/hook"
                  />
                  <Button onClick={testWebhook} disabled={testingWebhook || !testWebhookUrl.trim()}>
                    {testingWebhook ? "Testing..." : "Test webhook"}
                  </Button>
                </div>
                <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Retry policy</strong>: 3 attempts, exponential backoff
                    (1s, then 2s), 30s timeout per attempt — see{" "}
                    <code className="rounded bg-muted px-1 py-0.5">lib/connectors/http.ts</code>.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
