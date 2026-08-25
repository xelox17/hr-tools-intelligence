import { AlertCircle, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/kpi-card";
import type { DataQuality } from "@/hooks/useDataQuality";

interface ToolQualityEntry {
  name: string;
  qualityScore: number | null;
}

interface DataQualityOverviewProps {
  qualityData: DataQuality | null;
  /** Optional per-tool breakdown (from useToolHealth) used to render the bar chart. */
  toolsQuality?: ToolQualityEntry[];
}

export function DataQualityOverview({ qualityData, toolsQuality = [] }: DataQualityOverviewProps) {
  if (!qualityData) {
    return <p className="text-sm text-muted-foreground">No data quality metrics available yet.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Total employees" value={qualityData.totalEmployees} icon={Users} />
        <KpiCard
          label="Valid employees"
          value={`${qualityData.percentageValid}%`}
          icon={ShieldCheck}
        />
        <KpiCard
          label="Employees with issues"
          value={qualityData.employeesWithIssues}
          icon={AlertCircle}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {toolsQuality.length > 0 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Quality score by tool</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {toolsQuality.map((tool) => (
                <div key={tool.name} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{tool.name}</span>
                    <span className="text-muted-foreground">
                      {tool.qualityScore !== null ? `${tool.qualityScore}%` : "—"}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, tool.qualityScore ?? 0))}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Top 5 issues</CardTitle>
          </CardHeader>
          <CardContent>
            {qualityData.topIssues.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open issues recorded.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {qualityData.topIssues.map((issue) => (
                  <li
                    key={issue.issue}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
                  >
                    <span className="text-foreground">{issue.issue}</span>
                    <span className="font-heading font-bold text-foreground">{issue.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
