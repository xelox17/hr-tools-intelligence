import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ToolHealth, ToolStatus } from "@/hooks/useToolHealth";

const STATUS_CONFIG: Record<
  ToolStatus,
  { label: string; icon: typeof CheckCircle2; badge: string }
> = {
  healthy: {
    label: "Healthy",
    icon: CheckCircle2,
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  degraded: {
    label: "Degraded",
    icon: AlertTriangle,
    badge: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    badge: "bg-red-100 text-red-800 border-red-300",
  },
};

function formatLastSync(lastSync: string | null): string {
  if (!lastSync) return "Never synced";
  return new Date(lastSync).toLocaleString();
}

interface ToolHealthCardsProps {
  tools: ToolHealth[];
}

export function ToolHealthCards({ tools }: ToolHealthCardsProps) {
  if (tools.length === 0) {
    return <p className="text-sm text-muted-foreground">No tools to display.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => {
        const config = STATUS_CONFIG[tool.status] ?? STATUS_CONFIG.degraded;
        const Icon = config.icon;

        return (
          <Card
            key={tool.name}
            className="border-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="text-base">{tool.name}</CardTitle>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${config.badge}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {config.label}
              </span>
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
                    className="h-full rounded-full bg-accent"
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
                <span className="text-muted-foreground">Successful syncs (7d)</span>
                <span className="text-foreground">
                  {tool.successfulSyncs7d} / {tool.successfulSyncs7d + tool.failedSyncs7d}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
