"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Persists a value to localStorage and keeps it in sync across tabs (via
 * the native `storage` event). SSR-safe: renders `initialValue` until the
 * client-side effect hydrates from storage.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(key);
        if (stored !== null) setValue(JSON.parse(stored) as T);
      } catch {
        // Storage unavailable (private mode) or malformed value — keep initialValue.
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => clearTimeout(timeout);
  }, [key]);

  const setStoredValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = next instanceof Function ? next(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // Storage unavailable or quota exceeded — keep the in-memory value only.
        }
        return resolved;
      });
    },
    [key]
  );

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== key || event.newValue === null) return;
      try {
        setValue(JSON.parse(event.newValue) as T);
      } catch {
        // Ignore a malformed value written by another tab.
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [key]);

  return [value, setStoredValue, hydrated] as const;
}
