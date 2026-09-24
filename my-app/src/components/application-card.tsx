import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { getCategoryMeta } from "@/lib/category-meta";
import { useToolAnalytics } from "@/hooks/useToolAnalytics";
import { cn } from "@/lib/utils";
import type { Application } from "@/data/applications";

const STATUS_BADGE = {
  Active: "success",
  Planned: "info",
  Deprecated: "critical",
} as const;

export function ApplicationCard({ app }: { app: Application }) {
  const { icon: Icon, border, badge } = getCategoryMeta(app.subcategory);
  const { recordOpen } = useToolAnalytics();
  const status = app.status ?? "Active";

  return (
    <Card className={cn("h-full border-l-4 border-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg", border)}>
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <Badge variant={STATUS_BADGE[status]} size="sm">
            {status}
          </Badge>
        </div>
        <CardTitle className="text-base">{app.title}</CardTitle>
        {app.vendor && <p className="text-xs text-muted-foreground">{app.vendor}</p>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="line-clamp-2 text-sm text-muted-foreground">{app.description}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {app.subcategory && <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", badge)}>{app.subcategory}</span>}
          {app.scope && <Badge variant="secondary">{app.scope}</Badge>}
        </div>
        <a
          href={app.url}
          target="_blank"
          rel="noreferrer"
          onClick={() => recordOpen(app.id)}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-1 justify-center gap-1.5")}
        >
          Open
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </CardContent>
    </Card>
  );
}
