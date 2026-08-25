import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TimelineItem {
  id: string;
  icon?: LucideIcon;
  iconClassName?: string;
  title: ReactNode;
  timestamp: string;
  description?: ReactNode;
  details?: ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {items.map((item, index) => {
        const Icon = item.icon;
        const isLast = index === items.length - 1;

        return (
          <div key={item.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent",
                  item.iconClassName
                )}
              >
                {Icon ? <Icon className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-current" />}
              </span>
              {!isLast && <span className="w-px flex-1 bg-border" />}
            </div>
            <div className={cn("flex min-w-0 flex-1 flex-col gap-1", !isLast && "pb-6")}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-sm font-semibold text-foreground">{item.title}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(item.timestamp).toLocaleString()}
                </span>
              </div>
              {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
              {item.details}
            </div>
          </div>
        );
      })}
    </div>
  );
}
