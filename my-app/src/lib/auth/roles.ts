import { USER_ROLES } from './types';
import type { UserRole } from './types';

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  RH_MANAGER: 'RH Manager',
  RECRUITER: 'Recruiter',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  ADMIN: 'Full access to the portal.',
  RH_MANAGER: 'HR team member exploring the tool catalog.',
  RECRUITER: 'Recruitment team member exploring the tool catalog.',
  MANAGER: 'People manager exploring the tool catalog.',
  EMPLOYEE: 'Employee exploring the tool catalog.',
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}
