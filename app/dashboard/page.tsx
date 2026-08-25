"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { AlertOctagon, ArrowRight, Download, KeyRound, ScrollText, Users, Wrench } from "lucide-react";
import { useDashboardRefresh } from "./layout";
import { useAlerts } from "@/hooks/useAlerts";
import { useToolHealth } from "@/hooks/useToolHealth";
import { useDataQuality } from "@/hooks/useDataQuality";
import { ActiveAlerts } from "@/components/alerts/ActiveAlerts";
import { ToolHealthCards } from "@/components/tools/ToolHealthCards";
import { KpiCard } from "@/components/kpi-card";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const SEVERITY_ORDER: Record<string, number> = { critical: 0, warning: 1, info: 2 };

const QUICK_ACTIONS = [
  { href: "/dashboard/exports", label: "Export data", icon: Download },
  { href: "/dashboard/audit", label: "View audit log", icon: ScrollText },
  { href: "/dashboard/api-keys", label: "Manage API keys", icon: KeyRound },
];

export default function DashboardOpsPage() {
  const { alerts, loading: alertsLoading, error: alertsError, refetch: refetchAlerts } = useAlerts();
  const { tools, loading: toolsLoading, error: toolsError } = useToolHealth();
  const { qualityData, loading: qualityLoading } = useDataQuality();
  const { notifyRefresh } = useDashboardRefresh();

  useEffect(() => {
    if (!alertsLoading && !toolsLoading && !qualityLoading) {
      notifyRefresh();
    }
  }, [alerts, tools, qualityData, alertsLoading, toolsLoading, qualityLoading, notifyRefresh]);

  async function handleAcknowledge(id: string) {
    try {
      await fetch("/api/alerts/acknowledge", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId: id, acknowledgedBy: "dashboard-user" }),
      });
    } finally {
      refetchAlerts();
    }
  }

  const topAlerts = useMemo(
    () =>
      [...alerts]
        .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3))
        .slice(0, 5),
    [alerts]
  );

  const lastSync = useMemo(() => {
    const dates = tools.map((t) => t.lastSync).filter((d): d is string => Boolean(d));
    if (dates.length === 0) return null;
    return dates.reduce((max, d) => (new Date(d) > new Date(max) ? d : max), dates[0]);
  }, [tools]);

  const loading = alertsLoading || toolsLoading || qualityLoading;

  return (
    <div className="flex flex-col gap-10">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : (
          <>
            <KpiCard label="Tools tracked" value={tools.length} icon={Wrench} />
            <KpiCard label="Employees" value={qualityData?.totalEmployees ?? 0} icon={Users} />
            <KpiCard label="Active alerts" value={alerts.length} icon={AlertOctagon} />
            <KpiCard
              label="Last sync"
              value={lastSync ? new Date(lastSync).toLocaleTimeString() : "—"}
              icon={ScrollText}
            />
          </>
        )}
      </section>

      <section className="flex flex-wrap gap-3">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </Link>
        ))}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-foreground">Active Alerts</h2>
          <Link href="/dashboard/alerts" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1")}>
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {alertsError && <p className="text-sm text-destructive">{alertsError}</p>}
        {alertsLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <ActiveAlerts alerts={topAlerts} onAcknowledge={handleAcknowledge} />
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-foreground">Tool Health Status</h2>
          <Link href="/dashboard/health" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1")}>
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {toolsError && <p className="text-sm text-destructive">{toolsError}</p>}
        {toolsLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : (
          <ToolHealthCards tools={tools.slice(0, 6)} />
        )}
      </section>
    </div>
  );
}
