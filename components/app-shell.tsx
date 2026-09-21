"use client";

import { useEffect } from "react";
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

  useEffect(() => {
    if (!user && !isLoginRoute) router.replace(LOGIN_ROUTE);
  }, [user, isLoginRoute, router]);

  if (isLoginRoute) {
    return <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>;
  }

  if (!user) return null;

  return (
    <>
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Header />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:px-8 md:py-8">{children}</div>
        </main>
      </div>
      <FloatingChatWidget />
    </>
  );
}
