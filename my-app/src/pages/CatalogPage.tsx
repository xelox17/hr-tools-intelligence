import { useMemo, useState } from "react";
import { ArrowUpRight, Briefcase, Building2, GraduationCap, MapPin, UserSearch, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CATEGORIES, TOOLS, type ToolCategory } from "@/data/tools";

type Filter = "All" | ToolCategory;
const FILTERS: Filter[] = ["All", ...CATEGORIES];

const CATEGORY_ICON: Record<ToolCategory, typeof Briefcase> = {
  Recruitment: UserSearch,
  Learning: GraduationCap,
  Corporate: Building2,
  Payroll: Wallet,
  Local: MapPin,
};

/**
 * PDD UC0, section 4.1 (Core Features — Implémenté dans le MVP): search bar
 * filtering tools by name as you type, 6 category filter buttons, and a
 * 3-column card grid with an "Open tool" link. Data is static for now (the
 * PDD's SharePoint List source is a future step — see section 11).
 */
export default function CatalogPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  const tools = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOLS.filter((tool) => {
      const matchesQuery = q.length === 0 || tool.title.toLowerCase().startsWith(q);
      const matchesFilter = filter === "All" || tool.category === filter;
      return matchesQuery && matchesFilter;
    });
  }, [query, filter]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-foreground">HR Tools Portal</h1>
        <p className="text-sm text-muted-foreground">Discover, search and open the HR tools available to you.</p>
      </div>

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tools..."
        aria-label="Search tools"
        className="max-w-sm"
      />

      <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={cn(
              buttonVariants({ variant: filter === f ? "default" : "outline", size: "sm" }),
              "shrink-0"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {tools.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          No tools match your search.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const Icon = CATEGORY_ICON[tool.category];
            return (
              <li key={tool.title}>
                <Card className="h-full border-border transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg">
                  <CardHeader className="gap-3">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant={tool.scope === "Global" ? "default" : "secondary"}>{tool.scope}</Badge>
                    </div>
                    <CardTitle className="text-base">{tool.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {tool.country}
                      </span>
                      <Badge variant="outline">{tool.category}</Badge>
                    </div>
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-1 justify-center gap-1.5")}
                    >
                      Open tool
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
