"use client";

import { useCallback, useEffect, useState } from "react";

export interface TopIssue {
  issue: string;
  count: number;
}

export interface DataQuality {
  totalEmployees: number;
  validEmployees: number;
  employeesWithIssues: number;
  percentageValid: number;
  topIssues: TopIssue[];
}

const POLL_INTERVAL_MS = 30000;

export function useDataQuality() {
  const [qualityData, setQualityData] = useState<DataQuality | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuality = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/analytics/data-quality", { signal });
      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.error?.message ?? "Failed to load data quality.");
      }
      setQualityData(body.data);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to load data quality.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const kickoff = setTimeout(() => fetchQuality(controller.signal), 0);

    const interval = setInterval(() => {
      fetchQuality(controller.signal);
    }, POLL_INTERVAL_MS);

    return () => {
      controller.abort();
      clearTimeout(kickoff);
      clearInterval(interval);
    };
  }, [fetchQuality]);

  return { qualityData, loading, error };
}
