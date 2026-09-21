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

function loadDemoContext(): ContextData {
  const country = DEMO_EMPLOYEE.country;
  return {
    mode: 'demo',
    employee: DEMO_EMPLOYEE,
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
  // Demo mode always returns the sample profile; employeeId is ignored.
  return loadDemoContext();
}
