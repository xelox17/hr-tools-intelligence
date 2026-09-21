/**
 * Which pages need which permission, decided from the URL alone so the proxy
 * can answer before any page code runs (no flash of protected content).
 */

import { PAGE_ROUTES, canViewPage } from './roles';
import type { PageKey, UserRole } from './types';

export const LOGIN_ROUTE = '/login';
export const UNAUTHORIZED_ROUTE = '/error/unauthorized';

export type PageDecision = 'allow' | 'login' | 'unauthorized';

/**
 * Canonical form used for matching: percent-decoded (so `/%70ayroll` cannot
 * slip past a check for `/payroll`), duplicate slashes collapsed, trailing
 * slash removed, lower-cased. Returns null for malformed encodings.
 */
export function normalizePath(pathname: string): string | null {
  try {
    const decoded = decodeURIComponent(pathname).replace(/\/{2,}/g, '/').toLowerCase();
    return decoded.length > 1 ? decoded.replace(/\/$/, '') : decoded;
  } catch {
    return null;
  }
}

/** The protected page a path belongs to, if any. `/dashboard` is exact: its sub-routes are separate tools. */
export function pageForPath(normalizedPath: string): PageKey | null {
  for (const [page, route] of Object.entries(PAGE_ROUTES) as [PageKey, string][]) {
    if (page === 'DASHBOARD' ? normalizedPath === route : normalizedPath === route || normalizedPath.startsWith(`${route}/`)) {
      return page;
    }
  }
  return null;
}

export function decidePageAccess(pathname: string, role: UserRole | null): { decision: PageDecision; page: PageKey | null } {
  const path = normalizePath(pathname);
  if (path === null) return { decision: role ? 'unauthorized' : 'login', page: null };
  if (path === LOGIN_ROUTE) return { decision: 'allow', page: null };
  if (!role) return { decision: 'login', page: null };

  const page = pageForPath(path);
  if (page && !canViewPage(role, page)) return { decision: 'unauthorized', page };
  return { decision: 'allow', page };
}
