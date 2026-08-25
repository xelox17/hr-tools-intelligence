"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportModal, type ExportFormat, type ExportOptions } from "@/components/export/ExportModal";

interface ScheduledExport {
  id: string;
  type: string;
  format: string;
  frequency: string;
  recipients: string[];
  enabled: boolean;
  last_run: string | null;
  next_run: string | null;
  created_at: string;
}

const AVAILABLE_EXPORTS: { format: ExportFormat; type: string; label: string; description: string }[] = [
  { format: "csv", type: "tools", label: "Tools (CSV)", description: "All tools with health status and quality score." },
  {
    format: "csv",
    type: "employees",
    label: "Employees (CSV)",
    description: "All employees with data quality score and open issues.",
  },
  {
    format: "csv",
    type: "alerts",
    label: "Alerts (CSV)",
    description: "Alert history, optionally filtered by date range.",
  },
  {
    format: "pdf",
    type: "health",
    label: "Health report (PDF)",
    description: "Executive summary, tool health, and top issues.",
  },
];

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function extractFilename(disposition: string | null, fallback: string): string {
  const match = disposition ? /filename="([^"]+)"/.exec(disposition) : null;
  return match?.[1] ?? fallback;
}

export default function ExportsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [schedules, setSchedules] = useState<ScheduledExport[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [cutoff] = useState(() => Date.now() - THIRTY_DAYS_MS);

  const loadSchedules = useCallback(async () => {
    try {
      const res = await fetch("/api/export/schedule");
      const body = await res.json();
      if (res.ok && body.success) {
        setSchedules(body.data.scheduledExports);
      }
    } catch {
      toast.error("Failed to load scheduled exports.");
    } finally {
      setLoadingSchedules(false);
    }
  }, []);

  useEffect(() => {
    const kickoff = setTimeout(() => loadSchedules(), 0);
    return () => clearTimeout(kickoff);
  }, [loadSchedules]);

  async function downloadExport(format: ExportFormat, type: string, dateFrom?: string, dateTo?: string) {
    const key = `${format}-${type}`;
    setDownloadingKey(key);
    try {
      const params = new URLSearchParams({ type });
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/export/${format}?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Export failed.");
      }

      const blob = await res.blob();
      const filename = extractFilename(res.headers.get("Content-Disposition"), `export.${format}`);

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setDownloadingKey(null);
    }
  }

  async function handleExport(options: ExportOptions) {
    if (options.mode === "now") {
      await downloadExport(options.format, options.type, options.dateFrom, options.dateTo);
      setModalOpen(false);
      return;
    }

    try {
      const res = await fetch("/api/export/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: options.type,
          frequency: options.frequency,
          recipients: [],
          enabled: true,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to schedule export.");
      }
      toast.success("Export scheduled.");
      setModalOpen(false);
      loadSchedules();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to schedule export.");
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/export/schedule?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete scheduled export.");
      setSchedules((prev) => prev.filter((schedule) => schedule.id !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete scheduled export.");
    }
  }

  const recentSchedules = schedules.filter(
    (schedule) => new Date(schedule.created_at).getTime() >= cutoff
  );

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Exports &amp; Reports</h1>
          <p className="text-sm text-muted-foreground">
            Download CSV/PDF reports on demand, or schedule them to run automatically.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Export data</Button>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-lg font-bold text-foreground">Available exports</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AVAILABLE_EXPORTS.map((item) => {
            const key = `${item.format}-${item.type}`;
            const isDownloading = downloadingKey === key;
            return (
              <Card key={key} className="border-border">
                <CardHeader>
                  <CardTitle className="text-base">{item.label}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    disabled={isDownloading}
                    onClick={() => downloadExport(item.format, item.type)}
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Download
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-bold text-foreground">Scheduled exports</h2>
          <span className="text-xs text-muted-foreground">Entries auto-drop from this list after 30 days</span>
        </div>
        {loadingSchedules ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : recentSchedules.length === 0 ? (
          <Card className="border-dashed border-border">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <p className="text-sm text-muted-foreground">No scheduled exports yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {recentSchedules.map((schedule) => (
              <Card key={schedule.id} className="border-border">
                <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="font-heading text-sm font-bold text-foreground">
                      {schedule.type} · {schedule.format.toUpperCase()} · {schedule.frequency}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Last run: {schedule.last_run ? new Date(schedule.last_run).toLocaleString() : "Never"}{" "}
                      · Next run: {schedule.next_run ? new Date(schedule.next_run).toLocaleString() : "—"}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(schedule.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <ExportModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onExport={handleExport} />
    </div>
  );
}
