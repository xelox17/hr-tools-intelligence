"use client";

import { useEffect, useState } from "react";

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * GETs a session-protected JSON API (`{ success, data }` envelope) once.
 * The server decides what the caller may receive; a 401/403 surfaces as `error`.
 */
export function useApiResource<T>(url: string): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch(url, { signal: controller.signal, credentials: "same-origin" });
        const body = await response.json();
        if (!response.ok || !body.success) throw new Error(body.error?.message ?? `Request failed (${response.status}).`);
        setState({ data: body.data as T, loading: false, error: null });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ data: null, loading: false, error: error instanceof Error ? error.message : "Request failed." });
      }
    })();

    return () => controller.abort();
  }, [url]);

  return state;
}
