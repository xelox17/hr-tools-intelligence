"use client";

import { useCallback, useEffect, useState } from "react";

export type ToolStatus = "healthy" | "degraded" | "failed";

export interface ToolHealth {
  name: string;
  status: ToolStatus;
  lastSync: string | null;
  qualityScore: number | null;
  successfulSyncs7d: number;
  failedSyncs7d: number;
}

const POLL_INTERVAL_MS = 30000;

export function useToolHealth() {
  const [tools, setTools] = useState<ToolHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchToolHealth = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/analytics/tool-health", { signal });
      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.error?.message ?? "Failed to load tool health.");
      }
      setTools(body.data.tools);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to load tool health.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const kickoff = setTimeout(() => fetchToolHealth(controller.signal), 0);

    const interval = setInterval(() => {
      fetchToolHealth(controller.signal);
    }, POLL_INTERVAL_MS);

    return () => {
      controller.abort();
      clearTimeout(kickoff);
      clearInterval(interval);
    };
  }, [fetchToolHealth]);

  return { tools, loading, error };
}
