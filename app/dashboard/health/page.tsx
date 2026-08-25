"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, AlertOctagon, CheckCircle2, Clock, RefreshCw, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Timeline, type TimelineItem } from "@/components/ui/timeline";
import { SimpleLineChart, SimpleBarChart } from "@/components/ui/chart";
import { KpiCard } from "@/components/kpi-card";
import { useToolHealth, type ToolHealth, type ToolStatus } from "@/hooks/useToolHealth";
import { showAlert } from "@/components/ui/alert";

interface ToolRow {
  id: string;
  name: string;
}

interface QualityTrendPoint {
  date: string;
  qualityScore: number;
}

interface SyncLogEntry {
  id: number;
  syncStart: string;
  status: string;
  recordsSynced: number;
  recordsFailed: number;
  errorMessage: string | null;
}

interface ToolHealthDetail {
  tool: { id: string; name: string; category: string };
  qualityTrend: QualityTrendPoint[];
  syncLogs: SyncLogEntry[];
}

const STATUS_CONFIG: Record<
  ToolStatus,
  { label: string; icon: typeof CheckCircle2; badge: "success" | "warning" | "critical" }
> = {
  healthy: { label: "Healthy", icon: CheckCircle2, badge: "success" },
  degraded: { label: "Degraded", icon: AlertOctagon, badge: "warning" },
  failed: { label: "Failed", icon: XCircle, badge: "critical" },
};

function formatLastSync(lastSync: string | null): string {
  if (!lastSync) return "Never synced";
  return new Date(lastSync).toLocaleString();
}

function ScoreRing({ score }: { score: number | null }) {
  const clamped = score === null ? 0 : Math.min(100, Math.max(0, score));
  return (
    <div
      className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full transition-[background] duration-700"
      style={{
        background:
          score === null
            ? "var(--muted)"
            : `conic-gradient(var(--accent) ${clamped * 3.6}deg, var(--muted) ${clamped * 3.6}deg)`,
      }}
    >
      <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-card">
        <span className="font-heading text-2xl font-bold text-foreground">
          {score === null ? "—" : `${Math.round(clamped)}%`}
        </span>
        <span className="text-[0.65rem] text-muted-foreground">health score</span>
      </div>
    </div>
  );
}

function groupSyncCountsByDay(logs: SyncLogEntry[]): { date: string; syncs: number }[] {
  const counts = new Map<string, number>();
  for (const log of logs) {
    const day = log.syncStart.slice(0, 10);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, syncs]) => ({ date, syncs }));
}

export default function HealthPage() {
  const { tools, loading, error } = useToolHealth();
  const [toolIds, setToolIds] = useState<Record<string, string>>({});
  const [selectedTool, setSelectedTool] = useState<ToolHealth | null>(null);
  const [detail, setDetail] = useState<ToolHealthDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/tools?pageSize=50");
        const body = await res.json();
        if (!cancelled && res.ok && body.success) {
          const map: Record<string, string> = {};
          for (const t of body.data.items as ToolRow[]) map[t.name] = t.id;
          setToolIds(map);
        }
      } catch {
        // Tool-id lookup is only needed to open the detail modal; the grid
        // itself still renders fine without it.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    const timeout = setTimeout(() => setLastRefreshed(new Date()), 0);
    return () => clearTimeout(timeout);
  }, [tools, loading]);

  const openDetail = useCallback(
    async (tool: ToolHealth) => {
      const toolId = toolIds[tool.name];
      setSelectedTool(tool);
      if (!toolId) return;
      setDetailLoading(true);
      setDetail(null);
      try {
        const res = await fetch(`/api/analytics/tool-health/${toolId}`);
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body.error?.message ?? "Failed to load tool detail.");
        setDetail(body.data);
      } catch (err) {
        showAlert({ type: "error", title: "Failed to load sync history", description: (err as Error).message });
      } finally {
        setDetailLoading(false);
      }
    },
    [toolIds]
  );

  const overallScore = useMemo(() => {
    const scored = tools.filter((t) => t.qualityScore !== null);
    if (scored.length === 0) return null;
    return scored.reduce((sum, t) => sum + (t.qualityScore ?? 0), 0) / scored.length;
  }, [tools]);

  const uptimePercent = useMemo(() => {
    const successful = tools.reduce((sum, t) => sum + t.successfulSyncs7d, 0);
    const failed = tools.reduce((sum, t) => sum + t.failedSyncs7d, 0);
    const total = successful + failed;
    return total > 0 ? (successful / total) * 100 : 100;
  }, [tools]);

  const healthyCount = tools.filter((t) => t.status === "healthy").length;
  const degradedCount = tools.filter((t) => t.status === "degraded").length;
  const failedCount = tools.filter((t) => t.status === "failed").length;

  const timelineItems: TimelineItem[] = (detail?.syncLogs ?? []).map((log) => {
    const badge = log.status === "success" ? "success" : log.status === "partial_failure" ? "warning" : "critical";
    const icon = log.status === "success" ? CheckCircle2 : log.status === "partial_failure" ? AlertOctagon : XCircle;
    return {
      id: String(log.id),
      icon,
      iconClassName: badge === "success" ? "text-emerald-500" : badge === "warning" ? "text-amber-500" : "text-destructive",
      title: (
        <span className="flex items-center gap-2">
          <Badge variant={badge} size="sm">
            {log.status}
          </Badge>
          <span>{log.recordsSynced} synced{log.recordsFailed > 0 ? `, ${log.recordsFailed} failed` : ""}</span>
        </span>
      ),
      timestamp: log.syncStart,
      description: log.errorMessage ?? undefined,
    };
  });

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Tool Health</h1>
          <p className="text-sm text-muted-foreground">
            Live status from <code className="rounded bg-muted px-1 py-0.5">/api/analytics/tool-health</code>,
            refreshed every 30s.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5" />
          {lastRefreshed ? `Last updated: ${lastRefreshed.toLocaleTimeString()}` : "Loading..."}
        </div>
      </header>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <Card className="border-border bg-gradient-to-br from-accent/5 via-card to-card">
          <CardContent className="flex flex-col items-center gap-6 py-8 sm:flex-row sm:items-center sm:justify-around">
            <ScoreRing score={overallScore} />
            <div className="grid w-full grid-cols-2 gap-4 sm:w-auto sm:grid-cols-4">
              <KpiCard label="Uptime (7d)" value={`${uptimePercent.toFixed(1)}%`} icon={Activity} />
              <KpiCard label="Healthy" value={healthyCount} icon={CheckCircle2} />
              <KpiCard label="Degraded" value={degradedCount} icon={AlertOctagon} />
              <KpiCard label="Failed" value={failedCount} icon={XCircle} />
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : tools.length === 0 ? (
        <Card className="border-dashed border-border">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">No tools to display.</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const config = STATUS_CONFIG[tool.status] ?? STATUS_CONFIG.degraded;
            const Icon = config.icon;
            return (
              <button
                key={tool.name}
                type="button"
                onClick={() => openDetail(tool)}
                className="text-left"
              >
                <Card className="cursor-pointer border-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                  <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
                    <CardTitle className="text-base">{tool.name}</CardTitle>
                    <Badge variant={config.badge} size="sm">
                      <Icon className="h-3.5 w-3.5" />
                      {config.label}
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Quality score</span>
                      <span className="font-heading font-bold text-foreground">
                        {tool.qualityScore !== null ? `${tool.qualityScore}%` : "—"}
                      </span>
                    </div>
                    {tool.qualityScore !== null && (
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-accent transition-[width] duration-500"
                          style={{ width: `${Math.min(100, Math.max(0, tool.qualityScore))}%` }}
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        Last sync
                      </span>
                      <span className="text-foreground">{formatLastSync(tool.lastSync)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Syncs (7d)</span>
                      <span className="text-foreground">
                        {tool.successfulSyncs7d} / {tool.successfulSyncs7d + tool.failedSyncs7d}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={selectedTool !== null} onOpenChange={(open) => !open && setSelectedTool(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTool?.name}</DialogTitle>
            <DialogDescription>Quality history and sync activity over the last 7 days.</DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : !detail ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No detail available for this tool.</p>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Quality trend (7d)</h3>
                  <SimpleLineChart
                    data={detail.qualityTrend as unknown as Record<string, unknown>[]}
                    xKey="date"
                    yKey="qualityScore"
                    height={200}
                  />
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Sync count (7d)</h3>
                  <SimpleBarChart
                    data={groupSyncCountsByDay(detail.syncLogs)}
                    xKey="date"
                    yKey="syncs"
                    height={200}
                  />
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">
                  Sync activity ({timelineItems.length})
                </h3>
                {timelineItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No syncs recorded in the last 7 days.</p>
                ) : (
                  <Timeline items={timelineItems} />
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
