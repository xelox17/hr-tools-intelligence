"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Plug, Settings2, TestTube2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToolHealth } from "@/hooks/useToolHealth";

interface ToolRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  country: string | null;
  integration_type: string | null;
  auth_method: string | null;
  is_active: boolean;
  data_owner: string | null;
}

const STATUS_BADGE = {
  healthy: { variant: "success" as const, label: "Healthy" },
  degraded: { variant: "warning" as const, label: "Degraded" },
  failed: { variant: "critical" as const, label: "Failed" },
};

export default function IntegrationsPage() {
  const [tools, setTools] = useState<ToolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { tools: health } = useToolHealth();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/tools?pageSize=50");
        const body = await res.json();
        if (!cancelled && res.ok && body.success) {
          setTools(body.data.items);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-heading text-2xl font-bold text-foreground">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          The tools this platform syncs with — status is live from{" "}
          <code className="rounded bg-muted px-1 py-0.5">/api/analytics/tool-health</code>.
        </p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const toolHealth = health.find((h) => h.name === tool.name);
            const status = toolHealth ? STATUS_BADGE[toolHealth.status] : null;

            return (
              <Card
                key={tool.id}
                className="border-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <Plug className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{tool.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{tool.category}</p>
                    </div>
                  </div>
                  {status && (
                    <Badge variant={status.variant} size="sm">
                      {status.label}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {tool.description ?? "No description."}
                  </p>
                  <div className="flex flex-col gap-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Integration type</span>
                      <span className="text-foreground">{tool.integration_type ?? "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Auth method</span>
                      <span className="text-foreground">{tool.auth_method ?? "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quality score</span>
                      <span className="text-foreground">
                        {toolHealth?.qualityScore !== null && toolHealth?.qualityScore !== undefined
                          ? `${toolHealth.qualityScore}%`
                          : "—"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {tool.is_active ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Connected
                      </>
                    ) : (
                      "Inactive"
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                    <Button variant="outline" size="sm" className="gap-1.5" disabled title="Coming soon">
                      <Settings2 className="h-3.5 w-3.5" />
                      Configure
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" disabled title="Coming soon">
                      <TestTube2 className="h-3.5 w-3.5" />
                      Test Connection
                    </Button>
                    <Link
                      href="/dashboard/health"
                      className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
                    >
                      View Logs
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
