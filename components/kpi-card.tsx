import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  className?: string;
}

export function KpiCard({ label, value, icon: Icon, className }: KpiCardProps) {
  return (
    <Card className={cn("border-border", className)}>
      <CardContent className="flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-heading text-2xl font-bold text-foreground">{value}</span>
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}
