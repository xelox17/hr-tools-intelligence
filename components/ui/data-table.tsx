"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePagination } from "@/hooks/usePagination";

export interface DataTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Enables sorting on this column; return the raw value to compare. */
  sortValue?: (row: T) => string | number;
  /** Included in the global search match when set. */
  searchValue?: (row: T) => string;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  pageSize?: number;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  rowActions?: (row: T) => ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

type SortDirection = "asc" | "desc";

export function DataTable<T>({
  columns,
  data,
  getRowId,
  pageSize = 10,
  selectable = false,
  selectedIds,
  onSelectionChange,
  rowActions,
  searchable = false,
  searchPlaceholder = "Search...",
  loading = false,
  emptyMessage = "No data to display.",
  onRowClick,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ columnId: string; direction: SortDirection } | null>(null);
  const [internalSelected, setInternalSelected] = useState<Set<string>>(new Set());

  const selected = selectedIds ? new Set(selectedIds) : internalSelected;

  function setSelected(next: Set<string>) {
    if (onSelectionChange) onSelectionChange(Array.from(next));
    else setInternalSelected(next);
  }

  const filtered = useMemo(() => {
    if (!searchable || !search.trim()) return data;
    const query = search.trim().toLowerCase();
    return data.filter((row) =>
      columns.some((col) => col.searchValue?.(row).toLowerCase().includes(query))
    );
  }, [data, columns, search, searchable]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const column = columns.find((col) => col.id === sort.columnId);
    if (!column?.sortValue) return filtered;

    const copy = [...filtered];
    copy.sort((a, b) => {
      const aValue = column.sortValue!(a);
      const bValue = column.sortValue!(b);
      const comparison =
        typeof aValue === "number" && typeof bValue === "number"
          ? aValue - bValue
          : String(aValue).localeCompare(String(bValue));
      return sort.direction === "asc" ? comparison : -comparison;
    });
    return copy;
  }, [filtered, sort, columns]);

  const pagination = usePagination(sorted.length, { initialPageSize: pageSize });
  const pageRows = sorted.slice(pagination.offset, pagination.offset + pagination.pageSize);

  function toggleSort(columnId: string) {
    setSort((prev) => {
      if (prev?.columnId !== columnId) return { columnId, direction: "asc" };
      if (prev.direction === "asc") return { columnId, direction: "desc" };
      return null;
    });
  }

  function toggleRow(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function toggleAllOnPage() {
    const pageIds = pageRows.map(getRowId);
    const allSelected = pageIds.every((id) => selected.has(id));
    const next = new Set(selected);
    pageIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
    setSelected(next);
  }

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((row) => selected.has(getRowId(row)));

  return (
    <div className="flex flex-col gap-3">
      {searchable && (
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              pagination.goTo(1);
            }}
            placeholder={searchPlaceholder}
            className="pl-8"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {selectable && (
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    aria-label="Select all rows on this page"
                    checked={allOnPageSelected}
                    onChange={toggleAllOnPage}
                    className="h-4 w-4 rounded border-border accent-accent"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={cn(
                    "px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase",
                    column.className
                  )}
                >
                  {column.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.id)}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {column.header}
                      {sort?.columnId === column.id ? (
                        sort.direction === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
              {rowActions && <th className="w-10 px-3 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {(selectable ? [0] : []).concat(columns.map(() => 0)).map((_, j) => (
                    <td key={j} className="px-3 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                  {rowActions && (
                    <td className="px-3 py-3">
                      <Skeleton className="h-4 w-6" />
                    </td>
                  )}
                </tr>
              ))
            ) : pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                  className="px-3 py-12 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => {
                const id = getRowId(row);
                return (
                  <tr
                    key={id}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "border-b border-border transition-colors last:border-0",
                      onRowClick && "cursor-pointer hover:bg-muted/50"
                    )}
                  >
                    {selectable && (
                      <td className="px-3 py-2.5" onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`Select row ${id}`}
                          checked={selected.has(id)}
                          onChange={() => toggleRow(id)}
                          className="h-4 w-4 rounded border-border accent-accent"
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={column.id} className={cn("px-3 py-2.5 text-foreground", column.className)}>
                        {column.cell(row)}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="px-3 py-2.5 text-right" onClick={(event) => event.stopPropagation()}>
                        {rowActions(row)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && sorted.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            Showing {pagination.offset + 1}–{Math.min(pagination.offset + pagination.pageSize, sorted.length)} of{" "}
            {sorted.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={pagination.prev}
              disabled={!pagination.hasPrev}
              className="rounded-md border border-border px-2.5 py-1 font-medium text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              Prev
            </button>
            <span>
              Page {pagination.page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={pagination.next}
              disabled={!pagination.hasNext}
              className="rounded-md border border-border px-2.5 py-1 font-medium text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
