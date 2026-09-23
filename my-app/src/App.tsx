import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/app-shell";
import { LoginPage } from "@/components/auth/LoginPage";
import { AuthProvider } from "@/lib/auth/auth-context";
import HomePage from "@/pages/HomePage";
import CatalogPage from "@/pages/CatalogPage";
import AiAssistantPage from "@/pages/AiAssistantPage";

// HashRouter: the Power Apps player serves this as a static bundle with no
// server-side rewrite rule for a SPA's deep links (unlike Vercel, which the
// Next.js app relies on) — hash-based routes ("#/catalog") need no rewrite
// rule at all, so they're the portable choice for an unknown static host.
export default function App() {
  return (
    // attribute="class" toggles `class="dark"` on <html>, which is what
    // index.css's `@custom-variant dark (&:is(.dark *))` matches against.
    // Without this provider, useTheme()/setTheme() from useDarkMode.ts are
    // no-ops (no context to update) — the toggle button did nothing.
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <HashRouter>
        <AuthProvider>
          <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground font-sans lg:flex-row">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<AppShell />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/ai-assistant" element={<AiAssistantPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </div>
          <Toaster position="top-right" />
        </AuthProvider>
      </HashRouter>
    </ThemeProvider>
  );
}
