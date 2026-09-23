import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/app-shell";
import { LoginPage } from "@/components/auth/LoginPage";
import { AuthProvider } from "@/lib/auth/auth-context";
import HomePage from "@/pages/HomePage";
import CatalogPage from "@/pages/CatalogPage";
import ToolDetailPage from "@/pages/ToolDetailPage";
import AiAssistantPage from "@/pages/AiAssistantPage";
import DashboardPage from "@/pages/DashboardPage";
import TeamPage from "@/pages/TeamPage";
import PayrollPage from "@/pages/PayrollPage";
import RecruitmentPage from "@/pages/RecruitmentPage";
import PoliciesPage from "@/pages/PoliciesPage";
import ExportsPage from "@/pages/ExportsPage";
import UnauthorizedPage from "@/pages/UnauthorizedPage";
import { SettingsPage, ApiKeysPage, AuditLogsPage } from "@/pages/stubs";

// HashRouter: the Power Apps player serves this as a static bundle with no
// server-side rewrite rule for a SPA's deep links (unlike Vercel, which the
// Next.js app relies on) — hash-based routes ("#/team") need no rewrite rule
// at all, so they're the portable choice for an unknown static host.
export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground font-sans lg:flex-row">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<AppShell />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/tools/:id" element={<ToolDetailPage />} />
              <Route path="/ai-assistant" element={<AiAssistantPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/payroll" element={<PayrollPage />} />
              <Route path="/recruitment" element={<RecruitmentPage />} />
              <Route path="/policies" element={<PoliciesPage />} />
              <Route path="/exports" element={<ExportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/api-keys" element={<ApiKeysPage />} />
              <Route path="/audit-logs" element={<AuditLogsPage />} />
              <Route path="/error/unauthorized" element={<UnauthorizedPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </div>
        <Toaster position="top-right" />
      </AuthProvider>
    </HashRouter>
  );
}
