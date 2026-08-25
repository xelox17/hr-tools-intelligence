"use client";

import { useState } from "react";
import { AlertOctagon, AlertTriangle, CheckCircle2, Clock, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAlertColorClasses } from "@/utils/alertColors";
import type { ActiveAlert } from "@/hooks/useAlerts";

const SEVERITY_ORDER: Record<string, number> = { critical: 0, warning: 1, info: 2 };

const SEVERITY_ICON = {
  critical: AlertOctagon,
  warning: AlertTriangle,
  info: Info,
} as const;

interface ActiveAlertsProps {
  alerts: ActiveAlert[];
  onAcknowledge: (id: string) => void | Promise<void>;
}

export function ActiveAlerts({ alerts, onAcknowledge }: ActiveAlertsProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  const sorted = [...alerts].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3)
  );

  async function handleAcknowledge(id: string) {
    setPendingId(id);
    try {
      await onAcknowledge(id);
    } finally {
      setPendingId(null);
    }
  }

  if (sorted.length === 0) {
    return (
      <Card className="border-dashed border-border">
        <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <CheckCircle2 className="h-6 w-6 text-accent" />
          <p className="text-sm text-muted-foreground">
            No active alerts. Everything looks healthy.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((alert) => {
        const colors = getAlertColorClasses(alert.severity);
        const Icon = SEVERITY_ICON[alert.severity as keyof typeof SEVERITY_ICON] ?? Info;

        return (
          <div
            key={alert.id}
            className={`flex flex-col gap-3 rounded-xl border-l-4 p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-start sm:justify-between ${colors.bg} ${colors.border} ${colors.text}`}
          >
            <div className="flex gap-3">
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-heading text-sm font-bold">{alert.rule}</span>
                  {alert.tool && (
                    <Badge variant="outline" className="border-current/30 text-current">
                      {alert.tool}
                    </Badge>
                  )}
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide uppercase ${colors.badge}`}
                  >
                    {alert.severity}
                  </span>
                </div>
                <p className="text-sm">{alert.message}</p>
                <span className="inline-flex items-center gap-1 text-xs opacity-70">
                  <Clock className="h-3 w-3" />
                  {new Date(alert.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="shrink-0 self-start bg-white/60 hover:bg-white"
              disabled={pendingId === alert.id}
              onClick={() => handleAcknowledge(alert.id)}
            >
              {pendingId === alert.id ? "Acknowledging..." : "Acknowledge"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
