import { useCallback } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const STORAGE_KEY = "hr-tools-open-counts";

/**
 * PDD §8/§12 lists "Power BI (cible)" for a usage dashboard — real Power BI
 * needs a licensed workspace and a real data source (Dataverse/SQL) feeding
 * it, neither of which exist here. This is the honest, buildable stand-in:
 * count "Open tool" clicks per tool in this browser's localStorage, and
 * surface a simple "most opened" ranking on Home — same idea (usage
 * visibility), no BI infrastructure required. Per-browser only, like the
 * rest of this app's demo-grade persistence (see useToolsCatalog.ts).
 */
export function useToolAnalytics() {
  const [counts, setCounts] = useLocalStorage<Record<string, number>>(STORAGE_KEY, {});

  const recordOpen = useCallback(
    (toolId: string) => {
      setCounts((prev) => ({ ...prev, [toolId]: (prev[toolId] ?? 0) + 1 }));
    },
    [setCounts]
  );

  const topTools = useCallback(
    (limit = 5) =>
      Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id, count]) => ({ id, count })),
    [counts]
  );

  const totalOpens = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return { counts, recordOpen, topTools, totalOpens };
}
