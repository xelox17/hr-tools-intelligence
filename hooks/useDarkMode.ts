"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

/**
 * Thin wrapper around next-themes' useTheme — next-themes already persists
 * the choice (localStorage) and respects the system preference by default
 * (see the ThemeProvider in app/layout.tsx); this just exposes a simpler
 * `isDark`/`toggle` API for components that don't need the full theme enum.
 */
export function useDarkMode() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timeout);
  }, []);

  // Avoid a hydration mismatch: resolvedTheme is only meaningful once
  // mounted on the client (the server doesn't know the user's preference).
  const isDark = mounted && resolvedTheme === "dark";

  function toggle() {
    setTheme(isDark ? "light" : "dark");
  }

  return { isDark, theme, mounted, toggle, setTheme };
}
