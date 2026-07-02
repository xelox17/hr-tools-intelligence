import Link from "next/link";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryIcon } from "@/lib/category-icons";
import type { Tool } from "@/lib/types";

export function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link href={`/tools/${tool.id}`} className="group block h-full">
      <Card className="h-full border-border transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg">
        <CardHeader className="gap-3">
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-primary">
              <CategoryIcon category={tool.category} className="h-5 w-5" />
            </div>
            <Badge variant={tool.scope === "Corporate" ? "default" : "secondary"}>
              {tool.scope}
            </Badge>
          </div>
          <CardTitle className="text-base group-hover:text-accent">{tool.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="line-clamp-2 text-sm text-muted-foreground">{tool.shortDescription}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {tool.country}
            </span>
            <Badge variant="outline">{tool.category}</Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
