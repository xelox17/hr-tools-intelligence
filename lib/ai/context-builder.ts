/**
 * Assembles the `ContextData` injected into the system prompt.
 *
 * Phase 1 ("demo"): everything below is hardcoded sample data.
 * Phase 2 ("production"): replace the body of `loadProductionContext` with
 * real lookups (employee directory, tool catalogue, policy store). The rest
 * of the chat pipeline (route, hook, component) does not need to change.
 */

import type { ContextData, EmployeeProfile, HrContact, HrPolicy, HrToolInfo } from './system-prompt';

export type ContextMode = ContextData['mode'];

const DEMO_EMPLOYEE: EmployeeProfile = {
  id: 'demo-employee',
  firstName: 'Jean',
  lastName: 'Dupont',
  department: 'IT',
  country: 'France',
  language: 'français',
  managerName: 'Claire Martin',
};

/**
 * One profile per demo account (see lib/auth/demo-users.ts in the Next.js
 * app and my-app/src/lib/auth/demo-users.ts in the Power Apps code app —
 * kept in sync by hand, both are small and static). Without this, every
 * chat reply addressed the user as "Jean" regardless of which demo account
 * was actually signed in, including Admin.
 */
const DEMO_EMPLOYEES: Record<string, EmployeeProfile> = {
  'user-admin': {
    id: 'user-admin',
    firstName: 'Admin',
    lastName: 'Lesaffre',
    department: 'IT',
    country: 'France',
    language: 'français',
    managerName: null,
  },
  'user-rh-manager': {
    id: 'user-rh-manager',
    firstName: 'Marie',
    lastName: 'DuPont',
    department: 'HR',
    country: 'France',
    language: 'français',
    managerName: null,
  },
  'user-recruiter': {
    id: 'user-recruiter',
    firstName: 'Jean',
    lastName: 'Recruiter',
    department: 'Recruitment',
    country: 'France',
    language: 'français',
    managerName: 'Marie DuPont',
  },
  'user-manager': {
    id: 'user-manager',
    firstName: 'Sophie',
    lastName: 'Manager',
    department: 'IT',
    country: 'France',
    language: 'français',
    managerName: null,
  },
  'user-employee': {
    id: 'user-employee',
    firstName: 'Thomas',
    lastName: 'Employee',
    department: 'IT',
    country: 'France',
    language: 'français',
    managerName: 'Sophie Manager',
  },
};

const DEMO_TOOLS: HrToolInfo[] = [
  {
    id: 'successfactors',
    name: 'SuccessFactors',
    category: 'Core HR',
    description: 'Dossier employé, demandes de congés, organigramme.',
    countries: [],
  },
  {
    id: 'cornerstone',
    name: 'Cornerstone',
    category: 'Formation',
    description: 'Catalogue de formations et suivi des parcours.',
    countries: [],
  },
  {
    id: 'payfit-fr',
    name: 'Portail Paie France',
    category: 'Paie',
    description: 'Consultation des bulletins de paie.',
    countries: ['France'],
  },
  {
    id: 'timesheet-us',
    name: 'Timesheet US',
    category: 'Temps de travail',
    description: 'Saisie des heures pour les sites américains.',
    countries: ['United States'],
  },
];

const DEMO_POLICIES: HrPolicy[] = [
  {
    id: 'leave-fr',
    title: 'Congés annuels',
    summary: 'Congés payés selon le droit français et les accords Lesaffre ; la demande se fait dans SuccessFactors.',
    countries: ['France'],
  },
  {
    id: 'remote-fr',
    title: 'Télétravail',
    summary: 'Télétravail possible selon accord d’équipe et validation du manager.',
    countries: ['France'],
  },
  {
    id: 'leave-us',
    title: 'Paid Time Off',
    summary: 'PTO accrual per site policy; requests go through the local HR team.',
    countries: ['United States'],
  },
];

const DEMO_CONTACTS: HrContact[] = [
  { label: 'Service RH', email: 'rh@lesaffre.example', phone: '+33 0 00 00 00 00' },
];

/** Keeps entries with no country restriction plus those matching `country`. */
export function filterByCountry<T extends { countries: string[] }>(items: T[], country: string): T[] {
  return items.filter((item) => item.countries.length === 0 || item.countries.includes(country));
}

function loadDemoContext(employeeId: string | undefined): ContextData {
  const employee = (employeeId && DEMO_EMPLOYEES[employeeId]) || DEMO_EMPLOYEE;
  const country = employee.country;
  return {
    mode: 'demo',
    employee,
    tools: filterByCountry(DEMO_TOOLS, country),
    policies: filterByCountry(DEMO_POLICIES, country),
    contacts: DEMO_CONTACTS,
  };
}

export async function buildContextData(
  employeeId: string | undefined,
  mode: ContextMode = 'demo'
): Promise<ContextData> {
  if (mode === 'production') {
    if (!employeeId) throw new Error('employeeId is required in production mode.');
    // Phase 2: fetch the employee, tools and policies for `employeeId` here.
    throw new Error('Production context is not implemented yet (Phase 2).');
  }
  // Demo mode: one of the 5 known demo accounts if recognized, else the
  // generic "Jean Dupont" fallback (e.g. a caller that sends no employeeId).
  return loadDemoContext(employeeId);
}
