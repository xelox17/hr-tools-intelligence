import type { Tool } from "@/lib/types";

const CSV_HEADERS = ["Name", "Category", "Scope", "Country", "Description", "URL"];

function escapeCsvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function toolsToCSV(items: Tool[]): string {
  const rows = items.map((t) =>
    [t.name, t.category, t.scope, t.country, t.shortDescription, t.url]
      .map(escapeCsvField)
      .join(",")
  );
  return [CSV_HEADERS.join(","), ...rows].join("\n");
}

export function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
