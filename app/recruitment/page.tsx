"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, Plus, Trash2 } from "lucide-react";
import { AccessGate } from "@/components/auth/AccessGate";
import { PermissionIndicator } from "@/components/auth/PermissionIndicator";
import { ProtectedContent } from "@/components/auth/ProtectedContent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { showAlert } from "@/components/ui/alert";
import { useRecruitment } from "@/hooks/useDemoData";
import { useAuth, usePermission } from "@/lib/auth/hooks";
import { getPermissionLevel } from "@/lib/auth/roles";
import { CANDIDATE_STAGES, type Candidate, type CandidateStage, type Position } from "@/lib/auth/demo-data";

const SELECT_CLASS =
  "h-8 rounded-lg border border-input bg-card px-2 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

const STAGE_BADGE: Record<CandidateStage, "secondary" | "info" | "warning" | "success" | "critical"> = {
  applied: "secondary",
  screening: "info",
  interview: "info",
  offer: "warning",
  hired: "success",
  rejected: "critical",
};

function AddCandidateForm({ positions, onAdd }: { positions: Position[]; onAdd: (candidate: Candidate) => void }) {
  const openPositions = positions.filter((p) => p.status === "open");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [positionId, setPositionId] = useState(openPositions[0]?.id ?? "");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !positionId) return;
    onAdd({
      id: `cand-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      positionId,
      stage: "applied",
      appliedAt: new Date().toISOString().slice(0, 10),
      offerApproved: false,
    });
    setName("");
    setEmail("");
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <Input aria-label="Candidate name" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input aria-label="Candidate email" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <select aria-label="Position" className={SELECT_CLASS} value={positionId} onChange={(e) => setPositionId(e.target.value)}>
        {openPositions.map((p) => (
          <option key={p.id} value={p.id}>{p.title}</option>
        ))}
      </select>
      <Button type="submit"><Plus />Add candidate</Button>
    </form>
  );
}

/** Pipeline board. Edits are held in this component's state (demo): they are not saved to a server. */
function RecruitmentBoard({ positions, initialCandidates }: { positions: Position[]; initialCandidates: Candidate[] }) {
  const { role } = useAuth();
  const canEdit = usePermission("RECRUITMENT", "edit");
  const [candidates, setCandidates] = useState(initialCandidates);
  const [stageFilter, setStageFilter] = useState<CandidateStage | "all">("all");

  const positionTitle = (id: string) => positions.find((p) => p.id === id)?.title ?? "";
  const visible = useMemo(
    () => (stageFilter === "all" ? candidates : candidates.filter((c) => c.stage === stageFilter)),
    [candidates, stageFilter]
  );

  const update = (id: string, patch: Partial<Candidate>) =>
    setCandidates((current) => current.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const columns: DataTableColumn<Candidate>[] = [
    {
      id: "name",
      header: "Candidate",
      sortValue: (c) => c.name,
      searchValue: (c) => `${c.name} ${c.email}`,
      cell: (c) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{c.name}</span>
          <span className="text-xs text-muted-foreground">{c.email}</span>
        </div>
      ),
    },
    {
      id: "position",
      header: "Position",
      sortValue: (c) => positionTitle(c.positionId),
      searchValue: (c) => positionTitle(c.positionId),
      cell: (c) => positionTitle(c.positionId),
    },
    {
      id: "stage",
      header: "Status",
      sortValue: (c) => c.stage,
      cell: (c) => (
        <ProtectedContent page="RECRUITMENT" action="edit" fallback={<Badge variant={STAGE_BADGE[c.stage]}>{c.stage}</Badge>}>
          <select
            aria-label={`Status of ${c.name}`}
            className={SELECT_CLASS}
            value={c.stage}
            onChange={(e) => update(c.id, { stage: e.target.value as CandidateStage, offerApproved: false })}
          >
            {CANDIDATE_STAGES.map((stage) => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
        </ProtectedContent>
      ),
    },
    { id: "applied", header: "Applied", sortValue: (c) => c.appliedAt, cell: (c) => c.appliedAt },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Recruitment</h1>
          <p className="text-sm text-muted-foreground">Open positions and the candidate pipeline.</p>
        </div>
        {role && <PermissionIndicator level={getPermissionLevel(role, "RECRUITMENT")} showLabel />}
      </header>

      {!canEdit && (
        <p className="read-only rounded-r-lg px-3 py-2 text-sm text-foreground">
          You can view the pipeline but not change it.
        </p>
      )}

      <section aria-label="Open positions" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {positions.map((position) => (
          <Card key={position.id} size="sm">
            <CardContent className="flex items-start justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{position.title}</span>
                <span className="text-xs text-muted-foreground">{position.department} · {position.openings} opening(s)</span>
              </div>
              <Badge variant={position.status === "open" ? "success" : position.status === "on-hold" ? "warning" : "secondary"} size="sm">
                {position.status}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </section>

      <ProtectedContent page="RECRUITMENT" action="create">
        <Card>
          <CardHeader><CardTitle>Add a candidate</CardTitle></CardHeader>
          <CardContent>
            <AddCandidateForm
              positions={positions}
              onAdd={(candidate) => {
                setCandidates((current) => [candidate, ...current]);
                showAlert({ type: "success", title: "Candidate added" });
              }}
            />
          </CardContent>
        </Card>
      </ProtectedContent>

      <section aria-label="Candidates" className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="stage-filter" className="text-sm text-muted-foreground">Status</label>
          <select id="stage-filter" className={SELECT_CLASS} value={stageFilter} onChange={(e) => setStageFilter(e.target.value as CandidateStage | "all")}>
            <option value="all">All</option>
            {CANDIDATE_STAGES.map((stage) => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
        </div>
        <DataTable
          columns={columns}
          data={visible}
          getRowId={(c) => c.id}
          searchable
          searchPlaceholder="Search candidates or positions..."
          emptyMessage="No candidates match."
          rowActions={(c) => (
            <div className="flex items-center justify-end gap-1.5">
              {c.stage === "offer" && (
                <ProtectedContent page="RECRUITMENT" action="approve">
                  <Button size="xs" variant={c.offerApproved ? "secondary" : "outline"} onClick={() => update(c.id, { offerApproved: !c.offerApproved })}>
                    <BadgeCheck />
                    {c.offerApproved ? "Approved" : "Approve offer"}
                  </Button>
                </ProtectedContent>
              )}
              <ProtectedContent page="RECRUITMENT" action="delete">
                <Button size="icon-xs" variant="destructive" aria-label={`Delete ${c.name}`} onClick={() => setCandidates((current) => current.filter((x) => x.id !== c.id))}>
                  <Trash2 />
                </Button>
              </ProtectedContent>
            </div>
          )}
        />
      </section>
    </div>
  );
}

function RecruitmentView() {
  const { data, loading, error } = useRecruitment();

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (error || !data) return <p role="alert" className="text-sm text-destructive">{error ?? "Could not load recruitment data."}</p>;
  return <RecruitmentBoard positions={data.positions} initialCandidates={data.candidates} />;
}

export default function RecruitmentPage() {
  return (
    <AccessGate page="RECRUITMENT">
      <RecruitmentView />
    </AccessGate>
  );
}
