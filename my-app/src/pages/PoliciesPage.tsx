import { useState } from "react";
import { Pencil, Save, Trash2 } from "lucide-react";
import { AccessGate } from "@/components/auth/AccessGate";
import { PermissionIndicator } from "@/components/auth/PermissionIndicator";
import { ProtectedContent } from "@/components/auth/ProtectedContent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { showAlert } from "@/components/ui/alert";
import { useAuth, usePermission } from "@/lib/auth/hooks";
import { getPermissionLevel } from "@/lib/auth/roles";
import { INITIAL_POLICIES, type HrPolicyDoc } from "@/lib/auth/demo-data";

function PolicyCard({
  policy,
  onSave,
  onDelete,
}: {
  policy: HrPolicyDoc;
  onSave: (id: string, summary: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(policy.summary);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>{policy.title}</CardTitle>
          <Badge variant="secondary" size="sm">{policy.category}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Updated {policy.updatedAt}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {editing ? (
          <textarea
            aria-label={`Edit ${policy.title}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-input bg-card p-2 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        ) : (
          <p className="text-sm text-foreground">{policy.summary}</p>
        )}
        <div className="flex gap-2">
          <ProtectedContent page="POLICIES" action="edit">
            {editing ? (
              <Button
                size="sm"
                onClick={() => {
                  onSave(policy.id, draft.trim() || policy.summary);
                  setEditing(false);
                }}
              >
                <Save />Save
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => { setDraft(policy.summary); setEditing(true); }}>
                <Pencil />Edit
              </Button>
            )}
          </ProtectedContent>
          <ProtectedContent page="POLICIES" action="delete">
            <Button size="sm" variant="destructive" onClick={() => onDelete(policy.id)}>
              <Trash2 />Delete
            </Button>
          </ProtectedContent>
        </div>
      </CardContent>
    </Card>
  );
}

function PoliciesView() {
  const { role } = useAuth();
  const canEdit = usePermission("POLICIES", "edit");
  const [policies, setPolicies] = useState(INITIAL_POLICIES);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Policies</h1>
          <p className="text-sm text-muted-foreground">Leave, remote work, conduct and other HR policies.</p>
        </div>
        {role && <PermissionIndicator level={getPermissionLevel(role, "POLICIES")} showLabel />}
      </header>

      {!canEdit && (
        <p className="read-only rounded-r-lg px-3 py-2 text-sm text-foreground">
          Policies are read-only for your role.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {policies.map((policy) => (
          <PolicyCard
            key={policy.id}
            policy={policy}
            onSave={(id, summary) => {
              setPolicies((current) => current.map((p) => (p.id === id ? { ...p, summary, updatedAt: new Date().toISOString().slice(0, 10) } : p)));
              showAlert({ type: "success", title: "Policy updated" });
            }}
            onDelete={(id) => setPolicies((current) => current.filter((p) => p.id !== id))}
          />
        ))}
      </div>
      {policies.length === 0 && <p className="text-sm text-muted-foreground">No policies left.</p>}
    </div>
  );
}

export default function PoliciesPage() {
  return (
    <AccessGate page="POLICIES">
      <PoliciesView />
    </AccessGate>
  );
}
