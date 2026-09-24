/**
 * Demo login model. Simplified per the UC0 PDD scope: this app is a tool
 * catalog with a basic demo login, not an RBAC platform — there is no
 * per-page permission matrix here.
 */

export const USER_ROLES = ['ADMIN', 'RH_MANAGER', 'RECRUITER', 'MANAGER', 'EMPLOYEE'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  managerId?: string;
  teamId?: string;
  /** Used to filter the catalog to country-specific tools (PDD §5.3). All demo accounts are France for now. */
  country?: string;
}
