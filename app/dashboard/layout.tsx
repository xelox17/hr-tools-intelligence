"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { LayoutDashboard, RefreshCw } from "lucide-react";

interface DashboardRefreshContextValue {
  lastUpdated: Date | null;
  notifyRefresh: () => void;
}

const DashboardRefreshContext = createContext<DashboardRefreshContextValue | null>(null);

export function useDashboardRefresh(): DashboardRefreshContextValue {
  const context = useContext(DashboardRefreshContext);
  if (!context) {
    return { lastUpdated: null, notifyRefresh: () => {} };
  }
  return context;
}

function RefreshIndicator() {
  const { lastUpdated } = useDashboardRefresh();

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <RefreshCw className="h-3.5 w-3.5" />
      <span>{lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : "Loading..."}</span>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const notifyRefresh = useCallback(() => {
    setLastUpdated(new Date());
  }, []);

  return (
    <DashboardRefreshContext.Provider value={{ lastUpdated, notifyRefresh }}>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
                Lesaffre HR Tools Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Live alerts, tool health, and data quality across the HR toolset.
              </p>
            </div>
          </div>
          <RefreshIndicator />
        </header>
        {children}
      </div>
    </DashboardRefreshContext.Provider>
  );
}
