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
    country: 'Belgique',
    language: 'français',
    managerName: 'Marie DuPont',
  },
  'user-manager': {
    id: 'user-manager',
    firstName: 'Sophie',
    lastName: 'Manager',
    department: 'IT',
    country: 'USA',
    language: 'English',
    managerName: null,
  },
  'user-employee': {
    id: 'user-employee',
    firstName: 'Thomas',
    lastName: 'Employee',
    department: 'IT',
    country: 'Brésil',
    language: 'português',
    managerName: 'Sophie Manager',
  },
};

/**
 * Mirrors my-app/src/data/applications.ts's 23 HR tools (kept in sync by
 * hand — same reasoning as DEMO_EMPLOYEES above). Before this, the
 * assistant only knew about 4 generic placeholder tools, so anything
 * outside that list (e.g. "LINK", the group's actual core HR system) got
 * either invented or deflected — the prompt explicitly tells it to rely
 * only on this list and admit when something isn't on it.
 */
const DEMO_TOOLS: HrToolInfo[] = [
  // Recruitment
  { id: 'hr-rec-001', name: 'Smart Recruiters', category: 'Recruitment', description: 'ATS — gère tout le processus de recrutement, du sourcing à l’embauche.', countries: [], url: 'https://www.smartrecruiters.com/account/sign-in' },
  { id: 'hr-rec-002', name: 'WOO', category: 'Recruitment', description: 'World Of Opportunities — plateforme de mobilité interne pour postuler aux offres du groupe.', countries: [], url: 'https://woo.lesaffre.com/coopters/sign_in' },
  { id: 'hr-rec-003', name: 'NEST', category: 'Recruitment', description: 'Plateforme d’onboarding pour les nouveaux arrivants.', countries: [], url: 'https://lesaffre.apps.talmundo.com/' },
  { id: 'hr-rec-004', name: 'TAO', category: 'Recruitment', description: 'Gestion de carrière — entretiens annuels, compétences, plans de carrière.', countries: [], url: 'https://tao.lesaffre.com/' },
  { id: 'hr-rec-005', name: 'Travel Requests', category: 'Recruitment', description: 'Demandes et approbations de déplacements professionnels.', countries: [], url: 'https://apps.hirondelle.com/travel_requests' },
  // Learning
  { id: 'hr-learn-001', name: 'LEA', category: 'Learning', description: 'LMS — plateforme e-learning pour les contenus et cours de formation.', countries: [], url: 'https://lesaffre.eu.crossknowledge.com/interfaces/login.php' },
  { id: 'hr-learn-002', name: 'TIPI Group', category: 'Learning', description: 'Portail de formation centralisé pour tout le groupe.', countries: [], url: 'https://tipi.lesaffre.app/' },
  { id: 'hr-learn-003', name: 'TIPI L.int', category: 'Learning', description: 'Portail de formation local pour les sites locaux.', countries: ['France'], url: 'https://apps.powerapps.com/play/e/default-4a949dba-72f4-4fa8-a3eb-6cce3fab9022/a/6fc59930-9165-47e7-bc1f-af1e28422b3a' },
  { id: 'hr-learn-004', name: 'CTR', category: 'Learning', description: 'Inscription aux sessions de formation de l’Institut Léon Lesaffre.', countries: [], url: 'https://corporate-training-registration.lesaffre.com/' },
  { id: 'hr-learn-005', name: 'TIPI L.int', category: 'Learning', description: 'Portail de formation local pour les sites locaux.', countries: ['Belgique'], url: 'https://apps.powerapps.com/play/e/default-4a949dba-72f4-4fa8-a3eb-6cce3fab9022/a/6fc59930-9165-47e7-bc1f-af1e28422b3a' },
  { id: 'hr-learn-006', name: 'TIPI L.int', category: 'Learning', description: 'Portail de formation local pour les sites locaux.', countries: ['USA'], url: 'https://apps.powerapps.com/play/e/default-4a949dba-72f4-4fa8-a3eb-6cce3fab9022/a/6fc59930-9165-47e7-bc1f-af1e28422b3a' },
  { id: 'hr-learn-007', name: 'TIPI L.int', category: 'Learning', description: 'Portail de formation local pour les sites locaux.', countries: ['Brésil'], url: 'https://apps.powerapps.com/play/e/default-4a949dba-72f4-4fa8-a3eb-6cce3fab9022/a/6fc59930-9165-47e7-bc1f-af1e28422b3a' },
  // Corporate
  { id: 'hr-corp-001', name: 'LINK', category: 'Corporate', description: 'Système Core HR du groupe — référentiel central des données employés et organisationnelles (dossier employé, congés, organigramme).', countries: [], url: 'https://link.lesaffre.com/' },
  { id: 'hr-corp-002', name: 'User Management Tool - HR', category: 'Corporate', description: 'Gestion des identités et accès numériques tout au long du cycle de vie employé (équipes RH).', countries: [], url: 'https://apps.powerapps.com/play/f9b107b8-46b1-403d-b33b-333aabdd9fdb' },
  { id: 'hr-corp-003', name: 'User Management Tool - Managers', category: 'Corporate', description: 'Gestion des accès des membres d’équipe (managers).', countries: [], url: 'https://apps.powerapps.com/play/7a59b748-91a8-4c9e-a968-f382a0cf4cd4' },
  { id: 'hr-corp-004', name: 'CSE', category: 'Corporate', description: 'Portail des avantages salariés.', countries: [], url: 'https://cselect.club-employes.com/login' },
  { id: 'hr-corp-005', name: 'Bloomflow', category: 'Corporate', description: 'Gestion de projets RH.', countries: [], url: 'https://lesaffre.bloomflow.com/login' },
  { id: 'hr-corp-006', name: 'Office 365', category: 'Corporate', description: 'Suite Microsoft — email, collaboration, bureautique.', countries: [], url: 'https://www.office.com/' },
  { id: 'hr-corp-007', name: 'Knowledge Center', category: 'Corporate', description: 'Documentation centralisée — politiques, procédures RH.', countries: [], url: 'https://knowledge-center.hirondelle.com/' },
  // Payroll
  { id: 'hr-payroll-001', name: 'Bonus', category: 'Payroll', description: 'Gestion des campagnes de bonus annuels (RH, managers).', countries: [], url: 'https://bonus.lesaffre.com/' },
  { id: 'hr-payroll-002', name: 'MyBonus', category: 'Payroll', description: 'Portail employé pour participer aux campagnes de bonus et suivre les résultats.', countries: [], url: 'https://mybonus.lesaffre.com/users/sign_in' },
  { id: 'hr-payroll-003', name: 'ADP', category: 'Payroll', description: 'Système de paie — traitement de la paie et de la rémunération.', countries: [], url: 'https://mon.adp.com/redbox/' },
  { id: 'hr-payroll-004', name: 'CONCUR', category: 'Payroll', description: 'Gestion des notes de frais.', countries: [], url: 'https://www.concursolutions.com/' },
  { id: 'hr-payroll-005', name: 'Horoquartz', category: 'Payroll', description: 'Suivi du temps de travail.', countries: [], url: 'https://lesaffre.cloud-horoquartz.fr/webquartz/ux/home' },
  { id: 'hr-payroll-006', name: 'Time Tracking System', category: 'Payroll', description: 'Saisie des entrées de temps et de la présence.', countries: [], url: 'https://apps.hirondelle.com/tempspasse' },
  { id: 'hr-payroll-007', name: 'OODrive - CSP Paie', category: 'Payroll', description: 'Stockage sécurisé et accès aux documents de paie.', countries: [], url: 'https://sharing.oodrive.com/auth/ws/lesaffre-csppaie' },
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
    countries: ['USA'],
  },
  {
    id: 'leave-be',
    title: 'Congés annuels (Belgique)',
    summary: 'Congés payés selon le droit belge et les accords locaux ; la demande se fait via TIPI L.int.',
    countries: ['Belgique'],
  },
  {
    id: 'leave-br',
    title: 'Férias anuais (Brasil)',
    summary: 'Férias remuneradas conforme a legislação trabalhista brasileira e os acordos locais da Lesaffre.',
    countries: ['Brésil'],
  },
];

const DEMO_CONTACTS: HrContact[] = [
  { label: 'Service RH', email: 'rh@lesaffre.example', phone: '+33 0 00 00 00 00' },
];

/** Keeps entries with no country restriction plus those matching `country`. */
export function filterByCountry<T extends { countries: string[] }>(items: T[], country: string): T[] {
  return items.filter((item) => item.countries.length === 0 || item.countries.includes(country));
}

// Codes the frontend's language switcher can send (my-app/src/lib/i18n) —
// mapped to the label the system prompt shows the model ("Réponds dans la
// langue ... : <label>"), not the UI's own translation keys.
const LANGUAGE_LABELS: Record<string, string> = {
  fr: 'français',
  en: 'English',
  es: 'español',
};

function loadDemoContext(employeeId: string | undefined, languageCode?: string): ContextData {
  const employee = (employeeId && DEMO_EMPLOYEES[employeeId]) || DEMO_EMPLOYEE;
  const country = employee.country;
  const language = (languageCode && LANGUAGE_LABELS[languageCode]) || employee.language;
  return {
    mode: 'demo',
    employee: { ...employee, language },
    tools: filterByCountry(DEMO_TOOLS, country),
    policies: filterByCountry(DEMO_POLICIES, country),
    contacts: DEMO_CONTACTS,
  };
}

export async function buildContextData(
  employeeId: string | undefined,
  mode: ContextMode = 'demo',
  languageCode?: string
): Promise<ContextData> {
  if (mode === 'production') {
    if (!employeeId) throw new Error('employeeId is required in production mode.');
    // Phase 2: fetch the employee, tools and policies for `employeeId` here.
    throw new Error('Production context is not implemented yet (Phase 2).');
  }
  // Demo mode: one of the 5 known demo accounts if recognized, else the
  // generic "Jean Dupont" fallback (e.g. a caller that sends no employeeId).
  return loadDemoContext(employeeId, languageCode);
}
