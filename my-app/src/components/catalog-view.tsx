import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ApplicationCard } from "@/components/application-card";
import { hrSubcategories, type Application } from "@/data/applications";
import { translateAppDescription } from "@/data/application-translations";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { useAuth } from "@/lib/auth/hooks";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { LanguageCode } from "@/lib/i18n/translations";
import { filterVisibleTools } from "@/lib/visibility";
import { cn } from "@/lib/utils";

const SCOPES = ["Corporate", "Local"] as const;

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function matches(app: Application, query: string, language: LanguageCode): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const description = translateAppDescription(app.id, app.description, language);
  return [app.title, description, app.vendor, app.targetAudience]
    .filter((field): field is string => Boolean(field))
    .some((field) => field.toLowerCase().includes(q));
}

/**
 * HR tools only (see data/applications.ts's header comment) — this portal
 * is open to the whole ~6,000-employee workforce, so it surfaces what every
 * employee needs (recruitment, learning, payroll, core HR), not internal
 * Finance/Sales/R&D/etc. tooling. With a single category, there is no
 * top-level category filter — just the HR sub-category and scope. (No
 * status filter either — every tool here is Active, so it filtered nothing.)
 */
export function CatalogView() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { tools: allTools } = useToolsCatalog();
  const [query, setQuery] = useState("");
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [scopes, setScopes] = useState<string[]>([]);

  const visibleTools = useMemo(() => filterVisibleTools(allTools, user), [allTools, user]);
  const hiddenCount = allTools.length - visibleTools.length;

  const filtered = useMemo(() => {
    return visibleTools.filter((app) => {
      if (subcategories.length && !subcategories.includes(app.subcategory ?? "")) return false;
      if (scopes.length && !scopes.includes(app.scope ?? "")) return false;
      return matches(app, query, language);
    });
  }, [visibleTools, query, subcategories, scopes, language]);

  const hasActiveFilters = query.trim().length > 0 || subcategories.length > 0 || scopes.length > 0;

  function clearFilters() {
    setQuery("");
    setSubcategories([]);
    setScopes([]);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-foreground">{t("catalog.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("catalog.subtitle")}</p>
      </header>

      <div className="relative w-full sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("catalog.searchPlaceholder")}
          className="h-10 border-border bg-card pl-9"
        />
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
        <FilterGroup
          label={t("catalog.filterCategory")}
          options={[...hrSubcategories]}
          selected={subcategories}
          onToggle={(value) => setSubcategories((prev) => toggle(prev, value))}
          labelFor={(value) => t(`subcategory.${value}`)}
        />
        <FilterGroup
          label={t("catalog.filterScope")}
          options={[...SCOPES]}
          selected={scopes}
          onToggle={(value) => setScopes((prev) => toggle(prev, value))}
          labelFor={(value) => t(`scope.${value}`)}
        />

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex w-fit items-center gap-1 text-xs font-medium text-accent link-underline"
          >
            <X className="h-3.5 w-3.5" />
            {t("catalog.clearFilters")}
          </button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {t("catalog.showing", { count: filtered.length, total: visibleTools.length })}
        {hiddenCount > 0 && <span> · {t("catalog.hiddenCount", { count: hiddenCount })}</span>}
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
          <p className="font-heading text-base font-semibold text-foreground">{t("catalog.noResults.title")}</p>
          <p className="text-sm text-muted-foreground">{t("catalog.noResults.subtitle")}</p>
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
  labelFor = (value) => value,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  labelFor?: (value: string) => string;
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
                {labelFor(option)}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}
