import type { PageKey, Permission, PermissionAction, PermissionLevel, UserRole } from './types';
import { PAGE_KEYS, USER_ROLES } from './types';

type RolePermissions = Partial<Record<PermissionAction, boolean>>;
type PermissionMatrix = Record<PageKey, Record<UserRole, RolePermissions>>;

export const PERMISSIONS: PermissionMatrix = {
  DASHBOARD: {
    ADMIN: { view: true, edit: true, viewAll: true },
    RH_MANAGER: { view: true, edit: true, viewAll: true },
    RECRUITER: { view: true, edit: false, viewRecruitmentOnly: true },
    MANAGER: { view: true, edit: false, viewOwnTeamOnly: true },
    EMPLOYEE: { view: true, edit: false, viewOwnProfileOnly: true },
  },
  RECRUITMENT: {
    ADMIN: { view: true, create: true, edit: true, delete: true, approve: true },
    RH_MANAGER: { view: true, create: true, edit: true, delete: true, approve: true },
    RECRUITER: { view: true, create: true, edit: true, delete: true, approve: true },
    MANAGER: { view: true, create: false, edit: false, delete: false, approve: false },
    EMPLOYEE: { view: false },
  },
  POLICIES: {
    ADMIN: { view: true, edit: true, delete: true },
    RH_MANAGER: { view: true, edit: true, delete: false },
    RECRUITER: { view: true, edit: false, delete: false },
    MANAGER: { view: true, edit: false, delete: false },
    EMPLOYEE: { view: true, edit: false, delete: false },
  },
  TEAM: {
    ADMIN: { view: true, viewAll: true, edit: true },
    RH_MANAGER: { view: true, viewAll: true, edit: false },
    RECRUITER: { view: false },
    MANAGER: { view: true, viewOwnTeamOnly: true, edit: true },
    EMPLOYEE: { view: true, viewOwnProfileOnly: true, edit: false },
  },
  PAYROLL: {
    ADMIN: { view: true, viewAll: true, edit: true, approve: true },
    RH_MANAGER: { view: true, viewAll: true, edit: false, approve: true },
    RECRUITER: { view: false },
    MANAGER: { view: true, viewOwnTeamOnly: true, edit: false, approve: false },
    EMPLOYEE: { view: true, viewOwnOnly: true, edit: false, approve: false },
  },
  SETTINGS: {
    ADMIN: { view: true, edit: true },
    RH_MANAGER: { view: false },
    RECRUITER: { view: false },
    MANAGER: { view: false },
    EMPLOYEE: { view: false },
  },
  API_KEYS: {
    ADMIN: { view: true, create: true, delete: true },
    RH_MANAGER: { view: false },
    RECRUITER: { view: false },
    MANAGER: { view: false },
    EMPLOYEE: { view: false },
  },
  AUDIT_LOGS: {
    ADMIN: { view: true, export: true },
    RH_MANAGER: { view: false },
    RECRUITER: { view: false },
    MANAGER: { view: false },
    EMPLOYEE: { view: false },
  },
};

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  RH_MANAGER: 'RH Manager',
  RECRUITER: 'Recruiter',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  ADMIN: 'Full access to every page, settings, API keys and audit logs.',
  RH_MANAGER: 'Manages HR data: recruitment, policies and payroll for all employees.',
  RECRUITER: 'Runs the hiring pipeline. Read-only access to team and policies.',
  MANAGER: 'Sees and edits their own team. No access to payroll.',
  EMPLOYEE: 'Own profile, own payslips and read-only policies and recruitment.',
};

export const PAGE_LABELS: Record<PageKey, string> = {
  DASHBOARD: 'Dashboard',
  RECRUITMENT: 'Recruitment',
  POLICIES: 'Policies',
  TEAM: 'Team',
  PAYROLL: 'Payroll',
  SETTINGS: 'Settings',
  API_KEYS: 'API Keys',
  AUDIT_LOGS: 'Audit Logs',
};

/** URL of each protected page (used by navigation, redirects and the proxy gate). */
export const PAGE_ROUTES: Record<PageKey, string> = {
  DASHBOARD: '/dashboard',
  RECRUITMENT: '/recruitment',
  POLICIES: '/policies',
  TEAM: '/team',
  PAYROLL: '/payroll',
  SETTINGS: '/settings',
  API_KEYS: '/api-keys',
  AUDIT_LOGS: '/audit-logs',
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}

export function isPageKey(value: unknown): value is PageKey {
  return typeof value === 'string' && (PAGE_KEYS as readonly string[]).includes(value);
}

/** Pure lookup — no logging. Unknown roles/pages/actions are denied. */
export function canAccess(userRole: UserRole, page: PageKey, action: PermissionAction): boolean {
  return PERMISSIONS[page]?.[userRole]?.[action] === true;
}

export function canViewPage(userRole: UserRole, page: PageKey): boolean {
  return canAccess(userRole, page, 'view');
}

/**
 * Pages a role can open, in navigation order. Derived from PERMISSIONS (a
 * constant-size lookup, no I/O), so the sidebar, the server guards and the
 * tests can never disagree.
 */
export function getAccessiblePages(userRole: UserRole): PageKey[] {
  return PAGE_KEYS.filter((page) => canViewPage(userRole, page));
}

const WRITE_ACTIONS: PermissionAction[] = ['create', 'edit', 'delete', 'approve', 'export'];
const SCOPE_RESTRICTIONS: PermissionAction[] = [
  'viewOwnTeamOnly',
  'viewOwnProfileOnly',
  'viewOwnOnly',
  'viewRecruitmentOnly',
];

/**
 * none: cannot view. read: view only. edit: can change something, but not
 * everything the page offers (or only within their own scope). full: every
 * write action the page defines, on all data.
 */
export function getPermissionLevel(userRole: UserRole, page: PageKey): PermissionLevel {
  if (!canViewPage(userRole, page)) return 'none';

  const own = PERMISSIONS[page][userRole];
  const definedWrites = WRITE_ACTIONS.filter((action) =>
    USER_ROLES.some((role) => action in PERMISSIONS[page][role])
  );
  const grantedWrites = definedWrites.filter((action) => own[action] === true);

  if (grantedWrites.length === 0) return 'read';
  const scoped = SCOPE_RESTRICTIONS.some((flag) => own[flag] === true);
  return grantedWrites.length === definedWrites.length && !scoped ? 'full' : 'edit';
}

/** Every permission a role holds on a page, as a flat list (for the "My permissions" views). */
export function listPermissions(userRole: UserRole, page: PageKey): Permission[] {
  return Object.entries(PERMISSIONS[page][userRole]).map(([action, allowed]) => ({
    page,
    action: action as PermissionAction,
    allowed: allowed === true,
  }));
}
