import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Pencil, RotateCcw, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { hrSubcategories, type Application, type RoleLevel } from "@/data/applications";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { useAuth } from "@/lib/auth/hooks";

const SELECT_CLASS =
  "h-9 rounded-lg border border-input bg-card px-2 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50";
const ROLE_LEVELS: RoleLevel[] = ["All", "Manager", "HR"];
const SCOPES = ["Corporate", "Local"] as const;

type Draft = Omit<Application, "id"> & { id?: string };

const EMPTY_DRAFT: Draft = {
  title: "",
  category: "Human Resources",
  subcategory: "Recruitment",
  scope: "Corporate",
  roleLevel: "All",
  country: "",
  description: "",
  url: "",
  vendor: "",
  status: "Active",
};

function slugify(title: string): string {
  return `hr-custom-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || Date.now()}`;
}

function ToolForm({
  draft,
  onChange,
  onSubmit,
  onCancel,
  isEditing,
}: {
  draft: Draft;
  onChange: (next: Draft) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isEditing: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? `Modifier « ${draft.title} »` : "Ajouter un outil"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Nom de l'outil *</span>
            <Input required value={draft.title} onChange={(e) => onChange({ ...draft, title: e.target.value })} />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Catégorie</span>
            <select
              className={SELECT_CLASS}
              value={draft.subcategory}
              onChange={(e) => onChange({ ...draft, subcategory: e.target.value })}
            >
              {hrSubcategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Scope</span>
            <select
              className={SELECT_CLASS}
              value={draft.scope}
              onChange={(e) => onChange({ ...draft, scope: e.target.value as Application["scope"] })}
            >
              {SCOPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Visible pour (rôle)</span>
            <select
              className={SELECT_CLASS}
              value={draft.roleLevel}
              onChange={(e) => onChange({ ...draft, roleLevel: e.target.value as RoleLevel })}
            >
              {ROLE_LEVELS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Pays (vide = tous, seulement si Scope = Local)</span>
            <Input
              value={draft.country ?? ""}
              onChange={(e) => onChange({ ...draft, country: e.target.value })}
              placeholder="ex. France"
              disabled={draft.scope !== "Local"}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Description</span>
            <textarea
              rows={2}
              value={draft.description}
              onChange={(e) => onChange({ ...draft, description: e.target.value })}
              className="w-full rounded-lg border border-input bg-card p-2 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">URL *</span>
            <Input required type="url" value={draft.url} onChange={(e) => onChange({ ...draft, url: e.target.value })} placeholder="https://…" />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Vendor</span>
            <Input value={draft.vendor ?? ""} onChange={(e) => onChange({ ...draft, vendor: e.target.value })} />
          </label>

          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit">{isEditing ? "Enregistrer" : "Ajouter"}</Button>
            {isEditing && (
              <Button type="button" variant="outline" onClick={onCancel}>
                <X />
                Annuler
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function AdminView() {
  const { tools, addTool, updateTool, deleteTool, resetToDefault, hasLocalEdits } = useToolsCatalog();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);

  function startEdit(tool: Application) {
    setEditingId(tool.id);
    setDraft(tool);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  }

  function submit() {
    if (!draft.title.trim() || !draft.url.trim()) return;
    if (editingId) {
      updateTool(editingId, draft);
    } else {
      addTool({ ...draft, id: slugify(draft.title) } as Application);
    }
    cancelEdit();
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Administration du catalogue</h1>
          <p className="text-sm text-muted-foreground">
            Ajoutez, modifiez ou supprimez les outils RH sans toucher au code.
          </p>
        </div>
        {hasLocalEdits && (
          <Button variant="outline" size="sm" onClick={resetToDefault}>
            <RotateCcw />
            Revenir au catalogue par défaut
          </Button>
        )}
      </header>

      <p className="read-only rounded-r-lg px-3 py-2 text-sm text-foreground">
        Mode démo : ces modifications sont enregistrées uniquement dans ce navigateur (pas de SharePoint/Dataverse
        branché) — elles ne sont pas visibles sur les autres appareils.
      </p>

      <ToolForm draft={draft} onChange={setDraft} onSubmit={submit} onCancel={cancelEdit} isEditing={editingId !== null} />

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">{tools.length} outils</h2>
        <div className="flex flex-col gap-2">
          {tools.map((tool) => (
            <Card key={tool.id} size="sm">
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">{tool.title}</span>
                  <span className="truncate text-xs text-muted-foreground">{tool.description}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {tool.subcategory && (
                    <Badge variant="outline" size="sm">
                      {tool.subcategory}
                    </Badge>
                  )}
                  {tool.roleLevel && tool.roleLevel !== "All" && (
                    <Badge variant="secondary" size="sm">
                      {tool.roleLevel}
                    </Badge>
                  )}
                  <Button size="icon-xs" variant="outline" aria-label={`Modifier ${tool.title}`} onClick={() => startEdit(tool)}>
                    <Pencil />
                  </Button>
                  <Button
                    size="icon-xs"
                    variant="destructive"
                    aria-label={`Supprimer ${tool.title}`}
                    onClick={() => deleteTool(tool.id)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

/** Admin RH persona from the PDD (§3): add/edit/disable catalog tools without touching code. Gated to ADMIN. */
export default function AdminPage() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (user?.role !== "ADMIN") return <Navigate to="/" replace />;
  return <AdminView />;
}
