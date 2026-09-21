"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FloatingChatWidget } from "@/components/FloatingChatWidget";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/lib/auth/hooks";
import { LOGIN_ROUTE } from "@/lib/auth/page-gate";

/**
 * Chrome around every page: sidebar + header + chat widget for a signed-in
 * user, a bare canvas for /login. The proxy already redirects signed-out
 * visitors before this renders; the effect below is only a backstop.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginRoute = pathname === LOGIN_ROUTE;
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user && !isLoginRoute) router.replace(LOGIN_ROUTE);
  }, [user, isLoginRoute, router]);

  if (isLoginRoute) {
    return <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>;
  }

  if (!user) return null;

  return (
    <>
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Header onOpenMenu={() => setMenuOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          {/* Bottom padding keeps the last content clear of the floating chat button. */}
          <div className="mx-auto max-w-7xl px-4 pt-5 pb-24 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">{children}</div>
        </main>
      </div>
      <FloatingChatWidget />
    </>
  );
}
