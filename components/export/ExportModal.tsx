"use client";

import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type ExportFormat = "csv" | "pdf";
export type ExportType = "tools" | "employees" | "alerts";
export type ExportFrequency = "daily" | "weekly" | "monthly";
export type ExportMode = "now" | "schedule";

export interface ExportOptions {
  format: ExportFormat;
  type: ExportType;
  dateFrom?: string;
  dateTo?: string;
  mode: ExportMode;
  frequency?: ExportFrequency;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void | Promise<void>;
}

const TYPE_OPTIONS: { value: ExportType; label: string }[] = [
  { value: "tools", label: "Tools" },
  { value: "employees", label: "Employees" },
  { value: "alerts", label: "Alerts" },
];

export function ExportModal({ isOpen, onClose, onExport }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [type, setType] = useState<ExportType>("tools");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [frequency, setFrequency] = useState<ExportFrequency>("daily");
  const [submitting, setSubmitting] = useState<ExportMode | null>(null);

  async function handleSubmit(mode: ExportMode) {
    setSubmitting(mode);
    try {
      await onExport({
        format,
        type,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        mode,
        frequency: mode === "schedule" ? frequency : undefined,
      });
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export data</DialogTitle>
          <DialogDescription>
            Download a report now, or schedule it to run automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Format</span>
            <Select value={format} onValueChange={(value) => setFormat(value as ExportFormat)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {format === "csv" && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Type</span>
              <Select value={type} onValueChange={(value) => setType(value as ExportType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {format === "csv" && type === "alerts" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">From</span>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">To</span>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Schedule frequency</span>
            <Select value={frequency} onValueChange={(value) => setFrequency(value as ExportFrequency)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">Only used by &quot;Schedule&quot;.</span>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleSubmit("schedule")}
            disabled={submitting !== null}
          >
            {submitting === "schedule" ? "Scheduling..." : "Schedule"}
          </Button>
          <Button onClick={() => handleSubmit("now")} disabled={submitting !== null}>
            {submitting === "now" ? "Exporting..." : "Export Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
