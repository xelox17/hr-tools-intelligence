"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, History, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Timeline, type TimelineItem } from "@/components/ui/timeline";
import { AdminTokenBar } from "@/components/admin/AdminTokenBar";
import { showAlert } from "@/components/ui/alert";
import { useAdminToken, authHeaders } from "@/hooks/useAdminToken";

interface AuditRow {
  id: number;
  resource_type: string | null;
  resource_id: string | null;
  action: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  changed_by: string | null;
  change_reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const ACTION_BADGE: Record<string, "success" | "warning" | "critical" | "info"> = {
  CREATE: "success",
  UPDATE: "warning",
  REVOKE: "critical",
  DELETE: "critical",
};

function diffKeys(a: Record<string, unknown> | null, b: Record<string, unknown> | null): string[] {
  const keys = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]);
  return Array.from(keys).filter((key) => JSON.stringify(a?.[key]) !== JSON.stringify(b?.[key]));
}

function toCsv(rows: AuditRow[]): string {
  const header = ["id", "created_at", "changed_by", "action", "resource_type", "resource_id"];
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((row) =>
    [row.id, row.created_at, row.changed_by, row.action, row.resource_type, row.resource_id]
      .map(escape)
      .join(",")
  );
  return "﻿" + [header.map(escape).join(","), ...lines].join("\r\n");
}

const PAGE_SIZE = 20;

export default function AuditPage() {
  const { token } = useAdminToken();
  const [items, setItems] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [action, setAction] = useState("");
  const [userId, setUserId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = useCallback(
    async (targetPage: number, append: boolean) => {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(targetPage), pageSize: String(PAGE_SIZE) });
        if (resourceType) params.set("resourceType", resourceType);
        if (action) params.set("action", action);
        if (userId) params.set("userId", userId);
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);

        const res = await fetch(`/api/admin/audit?${params.toString()}`, { headers: authHeaders(token) });
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body.error?.message ?? "Failed to load audit log.");

        setItems((prev) => (append ? [...prev, ...body.data.items] : body.data.items));
        setTotal(body.data.total);
        setPage(targetPage);
      } catch (error) {
        showAlert({ type: "error", title: "Failed to load audit log", description: (error as Error).message });
      } finally {
        setLoading(false);
      }
    },
    [token, resourceType, action, userId, startDate, endDate]
  );

  useEffect(() => {
    const timeout = setTimeout(() => load(1, false), 0);
    return () => clearTimeout(timeout);
    // Re-run whenever a filter changes — `load` already depends on them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, resourceType, action, userId, startDate, endDate]);

  const filtered = search.trim()
    ? items.filter((row) =>
        `${row.changed_by ?? ""} ${row.action ?? ""} ${row.resource_type ?? ""}`
          .toLowerCase()
          .includes(search.trim().toLowerCase())
      )
    : items;

  function exportCsv() {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const timelineItems: TimelineItem[] = filtered.map((row) => {
    const changedKeys = diffKeys(row.old_values, row.new_values);
    const expanded = expandedId === row.id;

    return {
      id: String(row.id),
      icon: History,
      title: (
        <span className="flex flex-wrap items-center gap-2">
          <Badge variant={ACTION_BADGE[row.action ?? ""] ?? "outline"} size="sm">
            {row.action ?? "UNKNOWN"}
          </Badge>
          <span>{row.resource_type ?? "resource"}</span>
          {row.resource_id && <span className="font-mono text-xs text-muted-foreground">{row.resource_id}</span>}
        </span>
      ),
      timestamp: row.created_at,
      description: (
        <span>
          by <span className="font-medium text-foreground">{row.changed_by ?? "unknown"}</span>
          {row.ip_address && <span className="text-xs"> · {row.ip_address}</span>}
        </span>
      ),
      details: (
        <div className="mt-2 flex flex-col gap-2">
          {(row.old_values || row.new_values) && (
            <button
              type="button"
              onClick={() => setExpandedId(expanded ? null : row.id)}
              className="w-fit text-xs font-medium text-accent hover:underline"
            >
              {expanded ? "Hide diff" : `View diff (${changedKeys.length} field${changedKeys.length === 1 ? "" : "s"} changed)`}
            </button>
          )}
          {expanded && (
            <div className="grid grid-cols-1 gap-2 rounded-lg bg-muted p-3 text-xs sm:grid-cols-2">
              <div>
                <p className="mb-1 font-semibold text-muted-foreground">Before</p>
                <pre className="overflow-x-auto whitespace-pre-wrap">
                  {changedKeys.length === 0
                    ? "—"
                    : JSON.stringify(
                        Object.fromEntries(changedKeys.map((k) => [k, row.old_values?.[k] ?? null])),
                        null,
                        2
                      )}
                </pre>
              </div>
              <div>
                <p className="mb-1 font-semibold text-muted-foreground">After</p>
                <pre className="overflow-x-auto whitespace-pre-wrap">
                  {changedKeys.length === 0
                    ? "—"
                    : JSON.stringify(
                        Object.fromEntries(changedKeys.map((k) => [k, row.new_values?.[k] ?? null])),
                        null,
                        2
                      )}
                </pre>
              </div>
            </div>
          )}
        </div>
      ),
    };
  });

  return (
    <div className="flex flex-col gap-8">
      <AdminTokenBar />

      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">
            Every POST/PUT/DELETE tracked by <code className="rounded bg-muted px-1 py-0.5">middleware/audit-log.ts</code>.
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download className="h-4 w-4" />
          Export to CSV
        </Button>
      </header>

      <Card className="border-border">
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="relative min-w-48 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search loaded entries..."
              className="pl-8"
            />
          </div>
          <Input
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            placeholder="Resource type (e.g. api_key)"
            className="w-48"
          />
          <Input value={action} onChange={(e) => setAction(e.target.value)} placeholder="Action (e.g. CREATE)" className="w-40" />
          <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User id" className="w-40" />
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
        </CardContent>
      </Card>

      {!token ? (
        <Card className="border-dashed border-border">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Enter an admin token above to load the audit log.
          </CardContent>
        </Card>
      ) : loading && items.length === 0 ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : timelineItems.length === 0 ? (
        <Card className="border-dashed border-border">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No audit entries match these filters yet.
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border">
          <CardContent className="pt-6">
            <Timeline items={timelineItems} />
          </CardContent>
        </Card>
      )}

      {items.length < total && (
        <Button variant="outline" className="mx-auto" onClick={() => load(page + 1, true)} disabled={loading}>
          {loading ? "Loading..." : `Load more (${items.length} of ${total})`}
        </Button>
      )}
    </div>
  );
}
