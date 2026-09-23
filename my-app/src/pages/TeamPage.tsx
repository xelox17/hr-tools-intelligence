import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { AccessGate } from "@/components/auth/AccessGate";
import { PermissionIndicator } from "@/components/auth/PermissionIndicator";
import { ProtectedContent } from "@/components/auth/ProtectedContent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useTeam } from "@/hooks/useDemoData";
import { useAuth, usePermission } from "@/lib/auth/hooks";
import { getPermissionLevel } from "@/lib/auth/roles";
import { EMPLOYEE_STATUSES, type EmployeeStatus, type TeamMember } from "@/lib/auth/demo-data";

const SCOPE_TEXT = { all: "All employees.", team: "Members of your team.", self: "Your profile." } as const;
const STATUS_BADGE: Record<EmployeeStatus, "success" | "warning" | "info"> = { active: "success", "on-leave": "warning", remote: "info" };
const SELECT_CLASS =
  "h-8 rounded-lg border border-input bg-card px-2 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

type Edits = Record<string, Pick<TeamMember, "status" | "notes">>;

/** Directory table. Status/notes edits are held in state (demo): they are not saved to a server. */
function TeamTable({ members, scope }: { members: TeamMember[]; scope: keyof typeof SCOPE_TEXT }) {
  const { role } = useAuth();
  const canEdit = usePermission("TEAM", "edit");
  const [edits, setEdits] = useState<Edits>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Pick<TeamMember, "status" | "notes">>({ status: "active", notes: "" });

  const rows = members.map((m) => ({ ...m, ...edits[m.id] }));

  const columns: DataTableColumn<TeamMember>[] = [
    {
      id: "name",
      header: "Employee",
      sortValue: (m) => m.name,
      searchValue: (m) => `${m.name} ${m.email} ${m.department}`,
      cell: (m) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{m.name}</span>
          <span className="text-xs text-muted-foreground">{m.title} · {m.department}</span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortValue: (m) => m.status,
      cell: (m) =>
        editingId === m.id ? (
          <select aria-label="Status" className={SELECT_CLASS} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as EmployeeStatus })}>
            {EMPLOYEE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        ) : (
          <Badge variant={STATUS_BADGE[m.status]} size="sm">{m.status}</Badge>
        ),
    },
    {
      id: "notes",
      header: "Notes",
      searchValue: (m) => m.notes,
      cell: (m) =>
        editingId === m.id ? (
          <Input aria-label="Notes" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className="h-8" />
        ) : (
          <span className="text-muted-foreground">{m.notes || "—"}</span>
        ),
    },
    { id: "manager", header: "Manager", cell: (m) => m.managerName },
    { id: "start", header: "Start date", sortValue: (m) => m.startDate, cell: (m) => m.startDate },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Team</h1>
          <p className="text-sm text-muted-foreground">{SCOPE_TEXT[scope]}</p>
        </div>
        {role && <PermissionIndicator level={getPermissionLevel(role, "TEAM")} showLabel />}
      </header>

      {!canEdit && <p className="read-only rounded-r-lg px-3 py-2 text-sm text-foreground">The directory is read-only for your role.</p>}

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(m) => m.id}
        searchable={scope !== "self"}
        searchPlaceholder="Search employees..."
        emptyMessage="No team members."
        rowActions={(m) => (
          <ProtectedContent page="TEAM" action="edit">
            {editingId === m.id ? (
              <span className="inline-flex gap-1">
                <Button size="icon-xs" aria-label="Save changes" onClick={() => { setEdits((c) => ({ ...c, [m.id]: draft })); setEditingId(null); }}><Check /></Button>
                <Button size="icon-xs" variant="outline" aria-label="Cancel" onClick={() => setEditingId(null)}><X /></Button>
              </span>
            ) : (
              <Button size="icon-xs" variant="outline" aria-label={`Edit ${m.name}`} onClick={() => { setEditingId(m.id); setDraft({ status: m.status, notes: m.notes }); }}><Pencil /></Button>
            )}
          </ProtectedContent>
        )}
      />
    </div>
  );
}

function TeamView() {
  const { data, loading, error } = useTeam();

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (error || !data) return <p role="alert" className="text-sm text-destructive">{error ?? "Could not load the team."}</p>;
  return <TeamTable members={data.members} scope={data.scope} />;
}

export default function TeamPage() {
  return (
    <AccessGate page="TEAM">
      <TeamView />
    </AccessGate>
  );
}
