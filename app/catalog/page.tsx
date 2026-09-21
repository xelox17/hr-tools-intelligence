import { Suspense } from "react";
import Link from "next/link";
import { Activity, Bell, Code2, Plug, Sparkles } from "lucide-react";
import { AccessGate } from "@/components/auth/AccessGate";
import { CatalogView } from "@/components/catalog-view";
import { Skeleton } from "@/components/ui/skeleton";

function CatalogSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-full max-w-sm" />
      <Skeleton className="h-32 w-full" />
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full" />
        ))}
      </div>
    </div>
  );
}

// Open to every signed-in role and not role-restricted either, so they are reached from
// here rather than crowding the sidebar.
const OTHER_SPACES = [
  { href: "/insights", label: "AI Insights", icon: Sparkles },
  { href: "/dashboard/health", label: "Health", icon: Activity },
  { href: "/dashboard/alerts", label: "Alerts", icon: Bell },
  { href: "/dashboard/integrations", label: "Integrations", icon: Plug },
  { href: "/api-docs", label: "API Docs", icon: Code2 },
];

export default function CatalogPage() {
  return (
    <AccessGate page="CATALOG">
      <div className="flex flex-col gap-8">
        <Suspense fallback={<CatalogSkeleton />}>
          <CatalogView />
        </Suspense>

        <nav aria-label="Other spaces" className="flex flex-col gap-3 border-t border-border pt-6">
          <h2 className="font-heading text-sm font-semibold text-foreground">Other spaces</h2>
          <ul className="flex flex-wrap gap-2">
            {OTHER_SPACES.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <Icon className="h-4 w-4 text-primary" aria-hidden />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </AccessGate>
  );
}
