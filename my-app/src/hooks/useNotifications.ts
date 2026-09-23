/**
 * Polling-based notifications — there is no WebSocket/SSE push channel in
 * this backend, so "real-time" here means re-fetching GET /api/alerts/active
 * every 30s and toasting whatever alert ids weren't seen on the previous
 * poll. Unread count is derived from a persisted `lastSeenAt` timestamp so
 * it survives a page reload; it resets when markAllRead() is called (e.g.
 * opening the notification bell dropdown).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocalStorage } from "./useLocalStorage";
import { apiGet, ApiRequestError } from "@/lib/api";

export interface ActiveAlert {
  id: string;
  rule: string;
  message: string;
  severity: "critical" | "warning" | "info";
  tool?: string;
  created_at: string;
}

const POLL_INTERVAL_MS = 30000;
const LAST_SEEN_STORAGE_KEY = "hrt_notifications_last_seen_at";

function toastForSeverity(alert: ActiveAlert) {
  const description = alert.tool ? `${alert.tool} — ${alert.message}` : alert.message;
  if (alert.severity === "critical") {
    toast.error(alert.rule, { description });
  } else if (alert.severity === "warning") {
    toast.warning(alert.rule, { description });
  } else {
    toast.info(alert.rule, { description });
  }
}

export function useNotifications() {
  const [lastSeenAt, setLastSeenAt] = useLocalStorage<string>(
    LAST_SEEN_STORAGE_KEY,
    new Date(0).toISOString()
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);
  const knownIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  const poll = useCallback(async () => {
    try {
      const data = await apiGet<{ alerts: ActiveAlert[] }>("/api/alerts/active");
      const fetched = data.alerts;
      setAlerts(fetched);

      const newOnes = fetched.filter((alert) => !knownIds.current.has(alert.id));
      fetched.forEach((alert) => knownIds.current.add(alert.id));

      if (isFirstLoad.current) {
        const lastSeenMs = new Date(lastSeenAt).getTime();
        const unread = fetched.filter((alert) => new Date(alert.created_at).getTime() > lastSeenMs);
        setUnreadCount(unread.length);
      } else if (newOnes.length > 0) {
        setUnreadCount((count) => count + newOnes.length);
        newOnes.forEach(toastForSeverity);
      }

      isFirstLoad.current = false;
    } catch (err) {
      if (err instanceof ApiRequestError) return;
      // Silent otherwise — a background polling failure shouldn't spam an error toast.
    }
  }, [lastSeenAt]);

  useEffect(() => {
    const kickoff = setTimeout(() => void poll(), 0);
    const interval = setInterval(() => void poll(), POLL_INTERVAL_MS);

    return () => {
      clearTimeout(kickoff);
      clearInterval(interval);
    };
  }, [poll]);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
    setLastSeenAt(new Date().toISOString());
  }, [setLastSeenAt]);

  return { alerts, unreadCount, markAllRead };
}
