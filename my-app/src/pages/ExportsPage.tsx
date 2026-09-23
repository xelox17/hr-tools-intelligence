import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AccessGate } from "@/components/auth/AccessGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE_URL, getToken } from "@/lib/api";

// Simplified vs. the Next.js Exports page: on-demand downloads only. The
// scheduling UI (recurring exports by email) needs /api/export/schedule,
// which this code app hasn't been wired to yet.
type ExportFormat = "csv" | "pdf";

const AVAILABLE_EXPORTS: { format: ExportFormat; type: string; label: string; description: string }[] = [
  { format: "csv", type: "tools", label: "Tools (CSV)", description: "All tools with health status and quality score." },
  { format: "csv", type: "employees", label: "Employees (CSV)", description: "All employees with data quality score and open issues." },
  { format: "csv", type: "alerts", label: "Alerts (CSV)", description: "Alert history, optionally filtered by date range." },
  { format: "pdf", type: "health", label: "Health report (PDF)", description: "Executive summary, tool health, and top issues." },
];

function extractFilename(disposition: string | null, fallback: string): string {
  const match = disposition ? /filename="([^"]+)"/.exec(disposition) : null;
  return match?.[1] ?? fallback;
}

function ExportsView() {
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  async function downloadExport(format: ExportFormat, type: string) {
    const key = `${format}-${type}`;
    setDownloadingKey(key);
    try {
      const token = getToken();
      const headers = new Headers();
      if (token) headers.set("Authorization", `Bearer ${token}`);

      const res = await fetch(`${API_BASE_URL}/api/export/${format}?type=${type}`, { headers });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Export failed.");
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

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-heading text-2xl font-bold text-foreground">Exports &amp; Reports</h1>
        <p className="text-sm text-muted-foreground">Download CSV/PDF reports on demand.</p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                  {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}

export default function ExportsPage() {
  return (
    <AccessGate page="EXPORTS">
      <ExportsView />
    </AccessGate>
  );
}
