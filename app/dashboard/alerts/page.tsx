"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertOctagon, AlertTriangle, CheckCircle2, Clock, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleBarChart } from "@/components/ui/chart";
import { KpiCard } from "@/components/kpi-card";
import { showAlert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface HistoryAlert {
  id: string;
  rule: string;
  tool: string | null;
  severity: "critical" | "warning" | "info";
  message: string;
  status: string;
  created_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
}

const SEVERITY_ORDER: Record<string, number> = { critical: 0, warning: 1, info: 2 };

const SEVERITY_CONFIG = {
  critical: {
    icon: AlertOctagon,
    label: "Critical",
    gradient: "bg-gradient-to-r from-red-50 to-transparent dark:from-red-500/10",
    border: "border-l-red-500",
    badge: "critical" as const,
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    gradient: "bg-gradient-to-r from-yellow-50 to-transparent dark:from-yellow-500/10",
    border: "border-l-yellow-500",
    badge: "warning" as const,
  },
  info: {
    icon: Info,
    label: "Info",
    gradient: "bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-500/10",
    border: "border-l-blue-500",
    badge: "info" as const,
  },
};

const STATUS_BADGE: Record<string, "critical" | "warning" | "success"> = {
  open: "critical",
  acknowledged: "warning",
  resolved: "success",
};

const TIMEFRAME_DAYS: Record<string, number> = { "7d": 7, "30d": 30 };

function groupAlertsPerDay(alerts: HistoryAlert[], days: number): { date: string; count: number }[] {
  const buckets = new Map<string, number>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const alert of alerts) {
    const day = alert.created_at.slice(0, 10);
    if (buckets.has(day)) buckets.set(day, (buckets.get(day) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}

function topRules(alerts: HistoryAlert[]): { rule: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const alert of alerts) counts.set(alert.rule, (counts.get(alert.rule) ?? 0) + 1);
  return Array.from(counts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([rule, count]) => ({ rule, count }));
}

function AlertCard({
  alert,
  pending,
  onAcknowledge,
  onResolve,
}: {
  alert: HistoryAlert;
  pending: boolean;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
}) {
  const config = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.info;
  const Icon = config.icon;

  return (
    <div className={cn("flex flex-col gap-3 rounded-xl border-l-4 p-4 shadow-sm ring-1 ring-foreground/5 transition-shadow hover:shadow-md sm:flex-row sm:items-start sm:justify-between", config.gradient, config.border)}>
      <div className="flex gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-foreground/70" />
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-heading text-sm font-bold text-foreground">{alert.rule}</span>
            {alert.tool && (
              <Badge variant="outline" size="sm">
                {alert.tool}
              </Badge>
            )}
            <Badge variant={STATUS_BADGE[alert.status] ?? "outline"} size="sm">
              {alert.status}
            </Badge>
          </div>
          <p className="text-sm text-foreground/80">{alert.message}</p>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {new Date(alert.created_at).toLocaleString()}
          </span>
        </div>
      </div>

      {alert.status !== "resolved" && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 self-start">
          {alert.status === "open" && (
            <Button variant="outline" size="sm" disabled={pending} onClick={() => onAcknowledge(alert.id)}>
              Acknowledge
            </Button>
          )}
          <Button variant="outline" size="sm" disabled={pending} onClick={() => onResolve(alert.id)}>
            Resolve
          </Button>
          <div className="flex items-center gap-1" title="Coming soon — snooze requires a scheduled re-open, not yet implemented">
            {["1h", "1d", "1w"].map((s) => (
              <Button key={s} variant="ghost" size="sm" disabled className="px-2 text-xs">
                {s}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<HistoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<"7d" | "30d">("7d");
  const [severity, setSeverity] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<"none" | "tool" | "severity">("none");
  const [sort, setSort] = useState<"newest" | "oldest" | "severity">("newest");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = new Date(Date.now() - TIMEFRAME_DAYS[timeframe] * 86400000).toISOString();
      const params = new URLSearchParams({ pageSize: "100", startDate });
      if (severity !== "all") params.set("severity", severity);
      const res = await fetch(`/api/alerts/history?${params.toString()}`);
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.error?.message ?? "Failed to load alerts.");
      setAlerts(body.data.items);
    } catch (err) {
      showAlert({ type: "error", title: "Failed to load alerts", description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }, [timeframe, severity]);

  useEffect(() => {
    const timeout = setTimeout(() => load(), 0);
    return () => clearTimeout(timeout);
  }, [load]);

  async function updateStatus(id: string, targetStatus: "acknowledged" | "resolved") {
    setPendingId(id);
    try {
      const res = await fetch("/api/alerts/acknowledge", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId: id, acknowledgedBy: "dashboard-user", status: targetStatus }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.error?.message ?? "Failed to update alert.");
      showAlert({ type: "success", title: targetStatus === "resolved" ? "Alert resolved" : "Alert acknowledged" });
      await load();
    } catch (err) {
      showAlert({ type: "error", title: "Failed to update alert", description: (err as Error).message });
    } finally {
      setPendingId(null);
    }
  }

  const tools = useMemo(
    () => Array.from(new Set(alerts.map((a) => a.tool).filter((t): t is string => Boolean(t)))).sort(),
    [alerts]
  );

  const filtered = useMemo(() => {
    let result = status === "all" ? alerts : alerts.filter((a) => a.status === status);
    result = [...result].sort((a, b) => {
      if (sort === "severity") return (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3);
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sort === "oldest" ? diff : -diff;
    });
    return result;
  }, [alerts, status, sort]);

  const groups = useMemo(() => {
    if (groupBy === "none") return [{ key: "", items: filtered }];
    const map = new Map<string, HistoryAlert[]>();
    for (const alert of filtered) {
      const key = groupBy === "tool" ? alert.tool ?? "Unassigned" : SEVERITY_CONFIG[alert.severity]?.label ?? alert.severity;
      map.set(key, [...(map.get(key) ?? []), alert]);
    }
    return Array.from(map.entries()).map(([key, items]) => ({ key, items }));
  }, [filtered, groupBy]);

  const openCount = alerts.filter((a) => a.status === "open").length;
  const criticalCount = alerts.filter((a) => a.severity === "critical" && a.status !== "resolved").length;
  const acknowledgedCount = alerts.filter((a) => a.status === "acknowledged").length;
  const resolvedCount = alerts.filter((a) => a.status === "resolved").length;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-heading text-2xl font-bold text-foreground">Alerts</h1>
        <p className="text-sm text-muted-foreground">
          Backed by <code className="rounded bg-muted px-1 py-0.5">/api/alerts/history</code> — Acknowledge and
          Resolve are real actions; Snooze is not implemented yet (no scheduling column on the alerts table).
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Open" value={openCount} icon={AlertOctagon} />
        <KpiCard label="Critical (active)" value={criticalCount} icon={AlertTriangle} />
        <KpiCard label="Acknowledged" value={acknowledgedCount} icon={Clock} />
        <KpiCard label="Resolved" value={resolvedCount} icon={CheckCircle2} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border">
          <CardContent className="pt-6">
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Alerts per day ({timeframe === "7d" ? "7d" : "30d"})
            </h3>
            {loading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <SimpleBarChart data={groupAlertsPerDay(alerts, TIMEFRAME_DAYS[timeframe])} xKey="date" yKey="count" height={220} />
            )}
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Top rules</h3>
            {loading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <SimpleBarChart data={topRules(alerts)} xKey="rule" yKey="count" height={220} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <Select value={timeframe} onValueChange={(v) => setTimeframe(v as "7d" | "30d")}>
            <SelectTrigger><SelectValue placeholder="Timeframe" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severity} onValueChange={(v) => setSeverity(v ?? "all")}>
            <SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => setStatus(v ?? "all")}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as typeof groupBy)}>
            <SelectTrigger><SelectValue placeholder="Group by" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No grouping</SelectItem>
              <SelectItem value="tool">Group by tool</SelectItem>
              <SelectItem value="severity">Group by severity</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="severity">By severity</SelectItem>
            </SelectContent>
          </Select>
          {tools.length > 0 && (
            <span className="text-xs text-muted-foreground">{tools.length} tool(s) represented</span>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-border">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <CheckCircle2 className="h-6 w-6 text-accent" />
            <p className="text-sm text-muted-foreground">No alerts match these filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.key || "all"} className="flex flex-col gap-3">
              {group.key && (
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {group.key} <span className="text-xs">({group.items.length})</span>
                </h3>
              )}
              {group.items.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  pending={pendingId === alert.id}
                  onAcknowledge={(id) => updateStatus(id, "acknowledged")}
                  onResolve={(id) => updateStatus(id, "resolved")}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
