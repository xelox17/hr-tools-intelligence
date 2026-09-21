"use client";

import { Download } from "lucide-react";
import { AccessGate } from "@/components/auth/AccessGate";
import { ProtectedContent } from "@/components/auth/ProtectedContent";
import { RoleBadge } from "@/components/auth/RoleBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuditPage from "@/app/dashboard/audit/page";
import { useApiResource } from "@/hooks/useApiResource";
import type { AccessLogEntry } from "@/lib/auth/middleware";
import { PAGE_LABELS } from "@/lib/auth/roles";
import { downloadCSV } from "@/lib/csv";

const COLUMNS: DataTableColumn<AccessLogEntry>[] = [
  {
    id: "user",
    header: "User",
    sortValue: (e) => e.userName ?? e.userRole,
    searchValue: (e) => `${e.userName ?? ""} ${e.userRole}`,
    cell: (e) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-foreground">{e.userName ?? "—"}</span>
        <RoleBadge role={e.userRole} />
      </div>
    ),
  },
  { id: "action", header: "Action", sortValue: (e) => String(e.attemptedAction), searchValue: (e) => String(e.attemptedAction), cell: (e) => e.attemptedAction },
  { id: "page", header: "Page", sortValue: (e) => e.attemptedPage, searchValue: (e) => PAGE_LABELS[e.attemptedPage], cell: (e) => PAGE_LABELS[e.attemptedPage] },
  { id: "time", header: "Timestamp", sortValue: (e) => e.timestamp, cell: (e) => new Date(e.timestamp).toLocaleString() },
  { id: "ip", header: "IP", cell: (e) => e.ip ?? "—" },
  { id: "result", header: "Result", cell: (e) => <Badge variant="critical">{e.result}</Badge> },
];

function AccessLogTab() {
  const { data, loading, error } = useApiResource<{ events: AccessLogEntry[] }>("/api/audit/access-log");

  function exportCsv() {
    const rows = (data?.events ?? []).map((e) => [e.timestamp, e.userName ?? "", e.userRole, e.attemptedAction, e.attemptedPage, e.ip ?? "", e.result].join(","));
    downloadCSV("access-denials.csv", ["Timestamp,User,Role,Action,Page,IP,Result", ...rows].join("\n"));
  }

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (error || !data) return <p role="alert" className="text-sm text-destructive">{error ?? "Could not load the access log."}</p>;

  return (
    <div className="flex flex-col gap-4">
      <p className="read-only rounded-r-lg px-3 py-2 text-sm text-foreground">
        Denied access attempts, recorded server-side from the verified session. This list covers the current server
        instance; when a database is configured, every denial is also stored in the audit trail (see “System audit”).
      </p>
      <div className="flex justify-end">
        <ProtectedContent page="AUDIT_LOGS" action="export">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={data.events.length === 0}><Download />Export CSV</Button>
        </ProtectedContent>
      </div>
      <DataTable
        columns={COLUMNS}
        data={data.events}
        getRowId={(e) => e.id}
        searchable
        searchPlaceholder="Search user, action or page..."
        emptyMessage="No denied access attempts recorded."
      />
    </div>
  );
}

export default function AuditLogsPage() {
  return (
    <AccessGate page="AUDIT_LOGS">
      <Tabs defaultValue="access">
        <TabsList>
          <TabsIndicator />
          <TabsTrigger value="access">Access denials</TabsTrigger>
          <TabsTrigger value="system">System audit</TabsTrigger>
        </TabsList>
        <TabsContent value="access" className="pt-4">
          <h1 className="mb-4 font-heading text-2xl font-bold text-foreground">Access denials</h1>
          <AccessLogTab />
        </TabsContent>
        <TabsContent value="system" className="pt-4">
          <AuditPage />
        </TabsContent>
      </Tabs>
    </AccessGate>
  );
}
