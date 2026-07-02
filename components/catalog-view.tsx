"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Download, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolCard } from "@/components/tool-card";
import { downloadCSV, toolsToCSV } from "@/lib/csv";
import {
  filterTools,
  searchTools,
  tools,
  uniqueCategories,
  uniqueCountries,
} from "@/lib/analytics";
import type { ToolScope } from "@/lib/types";
import { cn } from "@/lib/utils";

const SCOPES: ToolScope[] = ["Corporate", "Local"];

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function CatalogView() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [categories, setCategories] = useState<string[]>([]);
  const [scopes, setScopes] = useState<ToolScope[]>([]);
  const [countries, setCountries] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const base = filterTools(tools, { categories, scopes, countries });
    return searchTools(base, query);
  }, [query, categories, scopes, countries]);

  const hasActiveFilters =
    query.trim().length > 0 ||
    categories.length > 0 ||
    scopes.length > 0 ||
    countries.length > 0;

  function clearFilters() {
    setQuery("");
    setCategories([]);
    setScopes([]);
    setCountries([]);
  }

  function handleExport() {
    if (filtered.length === 0) {
      toast.error("No tools to export — adjust your filters first.");
      return;
    }
    const csv = toolsToCSV(filtered);
    downloadCSV(`hr-tools-catalog-${filtered.length}.csv`, csv);
    toast.success(`Exported ${filtered.length} tool${filtered.length > 1 ? "s" : ""} to CSV.`);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Tools catalog</h1>
          <p className="text-sm text-muted-foreground">
            Search and filter the group&apos;s HR tools by category, scope and country.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search a tool..."
              className="h-10 border-border bg-card pl-9"
            />
          </div>
          <Button onClick={handleExport} className="gap-2 self-start sm:self-auto">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
        <FilterGroup
          label="Scope"
          options={SCOPES}
          selected={scopes}
          onToggle={(value) => setScopes((prev) => toggleValue(prev, value))}
        />
        <FilterGroup
          label="Category"
          options={uniqueCategories()}
          selected={categories}
          onToggle={(value) => setCategories((prev) => toggleValue(prev, value))}
        />
        <FilterGroup
          label="Country"
          options={uniqueCountries()}
          selected={countries}
          onToggle={(value) => setCountries((prev) => toggleValue(prev, value))}
        />

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex w-fit items-center gap-1 text-xs font-medium text-accent hover:underline"
          >
            <X className="h-3.5 w-3.5" />
            Clear all filters
          </button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
        {tools.length} tools
      </p>

      {filtered.length > 0 ? (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
        >
          {filtered.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="font-heading text-base font-semibold text-foreground">
            No tools match your filters
          </p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or clearing filters.
          </p>
        </div>
      )}
    </div>
  );
}

function FilterGroup<T extends string>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: T[];
  selected: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button key={option} type="button" onClick={() => onToggle(option)} aria-pressed={active}>
              <Badge
                variant={active ? "default" : "outline"}
                className={cn(
                  "cursor-pointer px-3 py-1 text-xs transition-colors",
                  active ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                )}
              >
                {option}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}
