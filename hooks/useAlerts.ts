"use client";

import { useCallback, useEffect, useState } from "react";

export interface ActiveAlert {
  id: string;
  rule: string;
  tool: string | null;
  severity: "critical" | "warning" | "info";
  message: string;
  status: string;
  created_at: string;
  acknowledged_at: string | null;
}

const POLL_INTERVAL_MS = 30000;

export function useAlerts() {
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/alerts/active", { signal });
      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.error?.message ?? "Failed to load alerts.");
      }
      setAlerts(body.data.alerts);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to load alerts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const kickoff = setTimeout(() => fetchAlerts(controller.signal), 0);

    const interval = setInterval(() => {
      fetchAlerts(controller.signal);
    }, POLL_INTERVAL_MS);

    return () => {
      controller.abort();
      clearTimeout(kickoff);
      clearInterval(interval);
    };
  }, [fetchAlerts]);

  const refetch = useCallback(() => fetchAlerts(), [fetchAlerts]);

  return { alerts, loading, error, refetch };
}
