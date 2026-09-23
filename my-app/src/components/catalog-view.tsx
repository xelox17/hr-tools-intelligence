import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ApplicationCard } from "@/components/application-card";
import { applications, categories, hrSubcategories, type Application } from "@/data/applications";
import { cn } from "@/lib/utils";

const HR_CATEGORY = "Human Resources";
type Status = NonNullable<Application["status"]>;
const STATUSES: Status[] = ["Active", "Planned", "Deprecated"];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function matches(app: Application, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [app.title, app.description, app.vendor, app.targetAudience]
    .filter((field): field is string => Boolean(field))
    .some((field) => field.toLowerCase().includes(q));
}

export function CatalogView() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [scopes, setScopes] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);

  const isHr = category === HR_CATEGORY;

  // Scopes only make sense within HR (it's the only category that sets them).
  const availableScopes = useMemo(
    () => Array.from(new Set(applications.filter((a) => a.category === HR_CATEGORY && a.scope).map((a) => a.scope as string))),
    []
  );

  const filtered = useMemo(() => {
    return applications.filter((app) => {
      if (category && app.category !== category) return false;
      if (isHr && subcategories.length && !subcategories.includes(app.subcategory ?? "")) return false;
      if (isHr && scopes.length && !scopes.includes(app.scope ?? "")) return false;
      if (statuses.length && !statuses.includes(app.status ?? "Active")) return false;
      return matches(app, query);
    });
  }, [query, category, subcategories, scopes, statuses, isHr]);

  const hasActiveFilters = query.trim().length > 0 || category !== null || subcategories.length > 0 || scopes.length > 0 || statuses.length > 0;

  function clearFilters() {
    setQuery("");
    setCategory(null);
    setSubcategories([]);
    setScopes([]);
    setStatuses([]);
  }

  function selectCategory(next: string | null) {
    setCategory(next);
    setSubcategories([]);
    setScopes([]);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-foreground">Lesaffre Applications Hub</h1>
        <p className="text-sm text-muted-foreground">Discover and access all Lesaffre business applications.</p>
      </header>

      <div className="relative w-full sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title, description, vendor, audience..."
          className="h-10 border-border bg-card pl-9"
        />
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
        <FilterGroup
          label="Category"
          options={categories}
          selected={category ? [category] : []}
          onToggle={(value) => selectCategory(category === value ? null : value)}
        />

        {isHr && (
          <>
            <FilterGroup
              label="HR sub-category"
              options={hrSubcategories}
              selected={subcategories}
              onToggle={(value) => setSubcategories((prev) => toggle(prev, value))}
            />
            <FilterGroup label="Scope" options={availableScopes} selected={scopes} onToggle={(value) => setScopes((prev) => toggle(prev, value))} />
          </>
        )}

        <FilterGroup
          label="Status"
          options={STATUSES}
          selected={statuses}
          onToggle={(value) => setStatuses((prev) => toggle(prev, value as Status))}
        />

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex w-fit items-center gap-1 text-xs font-medium text-accent link-underline"
          >
            <X className="h-3.5 w-3.5" />
            Clear all filters
          </button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {applications.length} applications
      </p>

      {filtered.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((app) => (
            <li key={app.id}>
              <ApplicationCard app={app} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="font-heading text-base font-semibold text-foreground">No applications found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
}

function FilterGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button key={option} type="button" onClick={() => onToggle(option)} aria-pressed={active}>
              <Badge
                variant={active ? "default" : "outline"}
                className={cn("cursor-pointer px-3 py-1 text-xs transition-colors", active ? "bg-accent text-accent-foreground" : "hover:bg-muted")}
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
