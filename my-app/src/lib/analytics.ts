import toolsData from "@/data/tools.json";
import type { Tool, ToolScope } from "@/lib/types";

export const tools: Tool[] = toolsData as Tool[];

export interface CategoryCount {
  category: string;
  count: number;
}

export interface ScopeCount {
  scope: ToolScope;
  count: number;
}

export function byScope(items: Tool[] = tools): ScopeCount[] {
  const counts = new Map<ToolScope, number>([
    ["Corporate", 0],
    ["Local", 0],
  ]);
  for (const tool of items) {
    counts.set(tool.scope, (counts.get(tool.scope) ?? 0) + 1);
  }
  return Array.from(counts, ([scope, count]) => ({ scope, count }));
}

export function uniqueCategories(): string[] {
  return Array.from(new Set(tools.map((t) => t.category))).sort();
}

export function uniqueCountries(): string[] {
  return Array.from(new Set(tools.map((t) => t.country))).sort();
}

export function getToolById(id: string): Tool | undefined {
  return tools.find((t) => t.id === id);
}

export function getSimilarTools(tool: Tool, limit = 4): Tool[] {
  const sameCategory = tools.filter(
    (t) => t.id !== tool.id && t.category === tool.category
  );
  const sameScope = tools.filter(
    (t) => t.id !== tool.id && t.scope === tool.scope && t.category !== tool.category
  );
  return [...sameCategory, ...sameScope].slice(0, limit);
}

export function searchTools(items: Tool[], query: string): Tool[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.country.toLowerCase().includes(q) ||
      t.shortDescription.toLowerCase().includes(q)
  );
}

export interface ToolFilters {
  categories: string[];
  scopes: ToolScope[];
  countries: string[];
}

export function filterTools(items: Tool[], filters: ToolFilters): Tool[] {
  return items.filter((t) => {
    if (filters.categories.length && !filters.categories.includes(t.category)) return false;
    if (filters.scopes.length && !filters.scopes.includes(t.scope)) return false;
    if (filters.countries.length && !filters.countries.includes(t.country)) return false;
    return true;
  });
}
