import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_LANGUAGE, LANGUAGES, translations, type LanguageCode } from "./translations";

const STORAGE_KEY = "hr-portal-language";

/** First segment of a BCP-47 tag ("en-US" → "en"), matched against our 3 supported codes. */
function detectBrowserLanguage(): LanguageCode {
  if (typeof navigator === "undefined") return DEFAULT_LANGUAGE;
  const candidates = navigator.languages && navigator.languages.length > 0 ? navigator.languages : [navigator.language];
  for (const tag of candidates) {
    const short = tag?.slice(0, 2).toLowerCase();
    if (LANGUAGES.some((l) => l.code === short)) return short as LanguageCode;
  }
  return DEFAULT_LANGUAGE;
}

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  /** Translates `key`, replacing `{{var}}` placeholders from `vars`. Falls back to the key itself if missing. */
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/**
 * Demo-scope multilingual support (fr/en/es): browser-detected on first
 * visit, then a manual switcher (header) overrides and persists it. The
 * same code rides along with chat messages (useChat.ts) so the AI answers
 * in the selected language too — see lib/ai/context-builder.ts's
 * LANGUAGE_LABELS on the backend.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && LANGUAGES.some((l) => l.code === stored)) {
        setLanguageState(stored as LanguageCode);
      } else {
        setLanguageState(detectBrowserLanguage());
      }
    } catch {
      setLanguageState(detectBrowserLanguage());
    } finally {
      setHydrated(true);
    }
  }, []);

  const setLanguage = useCallback((code: LanguageCode) => {
    setLanguageState(code);
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // Storage unavailable (private mode) — keep the in-memory value only.
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const entry = translations[key];
      let text = entry ? entry[language] ?? entry[DEFAULT_LANGUAGE] : key;
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          text = text.replace(new RegExp(`{{${name}}}`, "g"), String(value));
        }
      }
      return text;
    },
    [language]
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  // Render with the default language until hydrated to avoid a flash of a
  // different language right after localStorage/browser detection resolves.
  if (!hydrated) {
    return <LanguageContext.Provider value={{ language: DEFAULT_LANGUAGE, setLanguage, t }}>{children}</LanguageContext.Provider>;
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
