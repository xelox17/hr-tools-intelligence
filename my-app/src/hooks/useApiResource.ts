import { useEffect, useState } from "react";
import { apiGet, ApiRequestError } from "@/lib/api";

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * GETs a session-protected JSON API through the shared bearer-token client
 * (lib/api.ts) — cross-origin, so unlike the original Next.js app this
 * cannot rely on a same-origin cookie. A 401/403 surfaces as `error`.
 */
export function useApiResource<T>(path: string): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    (async () => {
      try {
        const data = await apiGet<T>(path);
        if (!cancelled) setState({ data, loading: false, error: null });
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof ApiRequestError ? error.message : "Request failed.";
        setState({ data: null, loading: false, error: message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [path]);

  return state;
}
