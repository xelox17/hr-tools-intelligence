"use client";

import { useCallback, useEffect, useState } from "react";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/kpi-card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { AdminTokenBar } from "@/components/admin/AdminTokenBar";
import { showAlert } from "@/components/ui/alert";
import { useAdminToken, authHeaders } from "@/hooks/useAdminToken";

interface ApiKeyRow {
  id: number;
  keyHash: string;
  name: string | null;
  ownerEmail: string;
  permissions: string[];
  isActive: boolean;
  lastUsed: string | null;
  createdAt: string;
  expiresAt: string | null;
}

const PERMISSION_OPTIONS = ["read", "write", "admin"] as const;

function formatDate(value: string | null): string {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const daysLeft = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return daysLeft > 0 && daysLeft <= 7;
}

export default function ApiKeysPage() {
  const { token } = useAdminToken();
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [permissions, setPermissions] = useState<string[]>(["read"]);
  const [expiresIn, setExpiresIn] = useState("90");
  const [submitting, setSubmitting] = useState(false);

  const loadKeys = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/keys", { headers: authHeaders(token) });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.error?.message ?? "Failed to load API keys.");
      setKeys(body.data.keys);
    } catch (error) {
      showAlert({ type: "error", title: "Failed to load API keys", description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timeout = setTimeout(() => loadKeys(), 0);
    return () => clearTimeout(timeout);
  }, [loadKeys]);

  function togglePermission(permission: string) {
    setPermissions((prev) =>
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]
    );
  }

  function resetForm() {
    setName("");
    setOwnerEmail("");
    setPermissions(["read"]);
    setExpiresIn("90");
    setNewKeyValue(null);
    setCopied(false);
  }

  async function handleGenerate() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({
          name,
          ownerEmail,
          permissions,
          expiresIn: Number(expiresIn) || 90,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.error?.message ?? "Failed to create API key.");
      setNewKeyValue(body.key);
      loadKeys();
    } catch (error) {
      showAlert({ type: "error", title: "Failed to create API key", description: (error as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(id: number) {
    try {
      const res = await fetch(`/api/keys?id=${id}`, { method: "DELETE", headers: authHeaders(token) });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.error?.message ?? "Failed to revoke key.");
      showAlert({ type: "success", title: "Key revoked" });
      loadKeys();
    } catch (error) {
      showAlert({ type: "error", title: "Failed to revoke key", description: (error as Error).message });
    }
  }

  async function copyKey() {
    if (!newKeyValue) return;
    await navigator.clipboard.writeText(newKeyValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const activeKeys = keys.filter((k) => k.isActive);
  const expiringSoon = keys.filter((k) => k.isActive && isExpiringSoon(k.expiresAt));

  const columns: DataTableColumn<ApiKeyRow>[] = [
    {
      id: "name",
      header: "Name",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.name ?? "Unnamed key"}</span>
          <span className="text-xs text-muted-foreground">{row.ownerEmail}</span>
        </div>
      ),
      sortValue: (row) => row.name ?? "",
      searchValue: (row) => `${row.name ?? ""} ${row.ownerEmail}`,
    },
    {
      id: "createdAt",
      header: "Created",
      cell: (row) => formatDate(row.createdAt),
      sortValue: (row) => row.createdAt,
    },
    {
      id: "expiresAt",
      header: "Expires",
      cell: (row) => (
        <span className={isExpiringSoon(row.expiresAt) ? "font-medium text-amber-600" : undefined}>
          {formatDate(row.expiresAt)}
        </span>
      ),
      sortValue: (row) => row.expiresAt ?? "",
    },
    {
      id: "permissions",
      header: "Permissions",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.permissions.map((p) => (
            <Badge key={p} variant="outline" size="sm">
              {p}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <Badge variant={row.isActive ? "success" : "outline"} size="sm">
          {row.isActive ? "Active" : "Revoked"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <AdminTokenBar />

      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">API Keys</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage keys for scripts and integrations (header <code className="rounded bg-muted px-1 py-0.5">x-api-key</code>).
          </p>
        </div>
        <Button className="gap-2" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Generate New Key
        </Button>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Total keys" value={keys.length} icon={KeyRound} />
        <KpiCard label="Active keys" value={activeKeys.length} icon={KeyRound} />
        <KpiCard label="Expiring within 7 days" value={expiringSoon.length} icon={KeyRound} />
      </section>

      <section className="flex flex-col gap-4">
        <DataTable
          columns={columns}
          data={keys}
          getRowId={(row) => String(row.id)}
          loading={loading}
          searchable
          searchPlaceholder="Search by name or owner..."
          emptyMessage={token ? "No API keys yet. Generate one to get started." : "Enter an admin token above to load keys."}
          rowActions={(row) =>
            row.isActive ? (
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive hover:bg-destructive/10"
                  aria-label="Revoke key"
                  onClick={() => handleRevoke(row.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : null
          }
        />
      </section>

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent>
          {newKeyValue ? (
            <>
              <DialogHeader>
                <DialogTitle>Key created</DialogTitle>
                <DialogDescription>
                  Copy this key now — it will never be shown again.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                <code className="flex-1 overflow-x-auto text-sm break-all">{newKeyValue}</code>
                <Button size="sm" variant="outline" onClick={copyKey}>
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Generate a new API key</DialogTitle>
                <DialogDescription>Expires after 90 days by default.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">Name</span>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="n8n sync automation" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">Owner email</span>
                  <Input
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="ops@lesaffre.com"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">Permissions</span>
                  <div className="flex gap-4">
                    {PERMISSION_OPTIONS.map((permission) => (
                      <label key={permission} className="flex items-center gap-1.5 text-sm text-foreground">
                        <input
                          type="checkbox"
                          checked={permissions.includes(permission)}
                          onChange={() => togglePermission(permission)}
                          className="h-4 w-4 rounded border-border accent-accent"
                        />
                        {permission}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">Expires in (days)</span>
                  <Input type="number" min={1} value={expiresIn} onChange={(e) => setExpiresIn(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={submitting || !name.trim() || !ownerEmail.trim() || permissions.length === 0}
                >
                  {submitting ? "Generating..." : "Generate"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
