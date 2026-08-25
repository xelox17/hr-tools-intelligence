"use client";

import { useState } from "react";

export interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
}

/** Reusable client-side pagination logic (page/pageSize/offset + nav helpers). */
export function usePagination(total: number, options: UsePaginationOptions = {}) {
  const [page, setPage] = useState(options.initialPage ?? 1);
  const [pageSize, setPageSizeState] = useState(options.initialPageSize ?? 10);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const offset = (clampedPage - 1) * pageSize;

  function next() {
    setPage((p) => Math.min(p + 1, totalPages));
  }

  function prev() {
    setPage((p) => Math.max(p - 1, 1));
  }

  function goTo(targetPage: number) {
    setPage(Math.min(Math.max(1, targetPage), totalPages));
  }

  function setPageSize(size: number) {
    setPageSizeState(size);
    setPage(1);
  }

  return {
    page: clampedPage,
    pageSize,
    totalPages,
    offset,
    hasNext: clampedPage < totalPages,
    hasPrev: clampedPage > 1,
    next,
    prev,
    goTo,
    setPageSize,
  };
}
