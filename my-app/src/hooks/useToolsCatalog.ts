import { useCallback } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { applications as defaultApplications, type Application } from "@/data/applications";

const STORAGE_KEY = "hr-tools-catalog-overrides";

/**
 * PDD's Admin RH persona needs to "ajouter / éditer / désactiver des outils
 * ... sans toucher au code" (§3, §4.1) via a SharePoint List. There is no
 * SharePoint/Dataverse here (kept as a static array by design — see
 * data/applications.ts's header comment), so this is the demo-grade
 * equivalent already used everywhere else in this app (login, chat
 * history): edits persist to this browser's localStorage, seeded from the
 * shipped default catalog, with a way back to that default. Real
 * multi-user persistence (so an edit is visible on other devices) needs a
 * real data source — Dataverse table or a Vercel-backed flow, matching the
 * pattern already built for the AI chat — and is a deliberate follow-up,
 * not implemented here.
 */
export function useToolsCatalog() {
  const [overrides, setOverrides, hydrated] = useLocalStorage<Application[] | null>(STORAGE_KEY, null);

  // Not hydrated yet: render the shipped defaults (avoids a flash of "0 tools").
  const tools = overrides ?? defaultApplications;

  const ensureOverrides = useCallback((): Application[] => overrides ?? [...defaultApplications], [overrides]);

  const addTool = useCallback(
    (tool: Application) => {
      setOverrides([...ensureOverrides(), tool]);
    },
    [ensureOverrides, setOverrides]
  );

  const updateTool = useCallback(
    (id: string, patch: Partial<Application>) => {
      setOverrides(ensureOverrides().map((t) => (t.id === id ? { ...t, ...patch } : t)));
    },
    [ensureOverrides, setOverrides]
  );

  const deleteTool = useCallback(
    (id: string) => {
      setOverrides(ensureOverrides().filter((t) => t.id !== id));
    },
    [ensureOverrides, setOverrides]
  );

  const resetToDefault = useCallback(() => {
    setOverrides(null);
  }, [setOverrides]);

  const hasLocalEdits = overrides !== null;

  return { tools, hydrated, addTool, updateTool, deleteTool, resetToDefault, hasLocalEdits };
}
