import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { FloatingChatWidget } from "@/components/FloatingChatWidget";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { useAuth, LOGIN_ROUTE } from "@/lib/auth/hooks";

/**
 * Chrome around every page: sidebar + header + chat widget for a signed-in
 * user. Unlike the Next.js app, there is no server proxy to redirect a
 * signed-out visitor before this renders — this effect is the only
 * enforcement of "must be signed in" for the UI (the API independently
 * requires a valid bearer token on every call regardless).
 */
export function AppShell() {
  const { user, ready } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (ready && !user) navigate(LOGIN_ROUTE, { replace: true });
  }, [ready, user, navigate]);

  if (!ready || !user) return null;

  return (
    <>
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Header onOpenMenu={() => setMenuOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          {/* `key` restarts the fade-in animation on navigation — a permanent
              fill-mode caused a z-index bug fixed by header's z-30 above. */}
          <div key={pathname} className="animate-fade-in mx-auto max-w-7xl px-4 pt-5 pb-24 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
            <Outlet />
          </div>
        </main>
      </div>
      <FloatingChatWidget />
    </>
  );
}
