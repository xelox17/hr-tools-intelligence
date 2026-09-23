/**
 * RBAC domain types. DEMO-GRADE: the role is chosen client-side (see
 * lib/auth/hooks.ts), so none of this is a security boundary on its own —
 * the API independently re-checks every request server-side.
 */

export const USER_ROLES = ['ADMIN', 'RH_MANAGER', 'RECRUITER', 'MANAGER', 'EMPLOYEE'] as const;
export type UserRole = (typeof USER_ROLES)[number];

// Order = sidebar order: the universal pages first, then the role-dependent ones.
export const PAGE_KEYS = [
  'HOME',
  'CATALOG',
  'AI_ASSISTANT',
  'DASHBOARD',
  'RECRUITMENT',
  'POLICIES',
  'TEAM',
  'PAYROLL',
  'EXPORTS',
  'SETTINGS',
  'API_KEYS',
  'AUDIT_LOGS',
] as const;
export type PageKey = (typeof PAGE_KEYS)[number];

export type PermissionAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'export'
  // Scope flags: what part of the data a role sees, not an operation.
  | 'viewAll'
  | 'viewOwnTeamOnly'
  | 'viewOwnProfileOnly'
  | 'viewOwnOnly'
  | 'viewRecruitmentOnly';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  managerId?: string;
  teamId?: string;
}

export interface Permission {
  page: PageKey;
  action: PermissionAction;
  allowed: boolean;
}

/** Summary of what a role can do on a page, for icons and badges. */
export type PermissionLevel = 'full' | 'edit' | 'read' | 'none';
