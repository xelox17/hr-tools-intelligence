/**
 * Server-only sample data behind /api/team, /api/payroll and /api/recruitment.
 * Nothing here is imported by client components, so a role that may not see
 * this data never receives it — not in the HTML, not in the JS bundle.
 * A production system would query the HR database instead.
 */

import { canAccess } from '@/lib/auth/roles';
import type { User } from '@/lib/auth/types';
import type { Candidate, PayrollRow, Payslip, Position, TeamMember } from '@/lib/auth/demo-data';

interface EmployeeRecord extends Omit<TeamMember, 'managerName'> {
  /** Yearly gross salary, EUR. */
  annualGross: number;
}

const EMPLOYEES: EmployeeRecord[] = [
  { id: 'user-admin', name: 'Admin Lesaffre', email: 'admin@lesaffre.com', department: 'IT', title: 'System Administrator', managerId: null, teamId: null, startDate: '2018-03-01', status: 'active', notes: '', annualGross: 68000 },
  { id: 'user-rh-manager', name: 'Marie DuPont', email: 'marie@lesaffre.com', department: 'HR', title: 'HR Manager', managerId: null, teamId: 'team-hr-1', startDate: '2016-09-12', status: 'active', notes: '', annualGross: 74000 },
  { id: 'user-recruiter', name: 'Jean Recruiter', email: 'jean.recruiter@lesaffre.com', department: 'Recruitment', title: 'Talent Acquisition Specialist', managerId: 'user-rh-manager', teamId: 'team-hr-1', startDate: '2021-01-18', status: 'remote', notes: '', annualGross: 46000 },
  { id: 'user-manager', name: 'Sophie Manager', email: 'sophie@lesaffre.com', department: 'IT', title: 'IT Team Lead', managerId: null, teamId: 'team-it-1', startDate: '2017-05-02', status: 'active', notes: '', annualGross: 72000 },
  { id: 'user-employee', name: 'Thomas Employee', email: 'thomas@lesaffre.com', department: 'IT', title: 'Software Engineer', managerId: 'user-manager', teamId: 'team-it-1', startDate: '2022-06-06', status: 'active', notes: 'Mentoring the new joiner.', annualGross: 52000 },
  { id: 'emp-lea', name: 'Léa Martin', email: 'lea.martin@lesaffre.com', department: 'IT', title: 'Data Analyst', managerId: 'user-manager', teamId: 'team-it-1', startDate: '2023-02-13', status: 'on-leave', notes: 'Back on 14 Oct.', annualGross: 48000 },
  { id: 'emp-karim', name: 'Karim Benali', email: 'karim.benali@lesaffre.com', department: 'IT', title: 'DevOps Engineer', managerId: 'user-manager', teamId: 'team-it-1', startDate: '2020-10-05', status: 'active', notes: '', annualGross: 56000 },
  { id: 'emp-paul', name: 'Paul Girard', email: 'paul.girard@lesaffre.com', department: 'Finance', title: 'Financial Controller', managerId: null, teamId: 'team-fin-1', startDate: '2019-04-23', status: 'active', notes: '', annualGross: 63000 },
];

export const POSITIONS: Position[] = [
  { id: 'pos-1', title: 'Senior Data Engineer', department: 'IT', openings: 2, status: 'open' },
  { id: 'pos-2', title: 'HR Business Partner', department: 'HR', openings: 1, status: 'open' },
  { id: 'pos-3', title: 'Quality Analyst', department: 'Production', openings: 3, status: 'open' },
  { id: 'pos-4', title: 'Payroll Specialist', department: 'Finance', openings: 1, status: 'on-hold' },
  { id: 'pos-5', title: 'Supply Chain Planner', department: 'Logistics', openings: 1, status: 'closed' },
];

export const CANDIDATES: Candidate[] = [
  { id: 'cand-1', name: 'Camille Roux', email: 'camille.roux@example.com', positionId: 'pos-1', stage: 'interview', appliedAt: '2026-08-28', offerApproved: false },
  { id: 'cand-2', name: 'Hugo Lambert', email: 'hugo.lambert@example.com', positionId: 'pos-1', stage: 'screening', appliedAt: '2026-09-02', offerApproved: false },
  { id: 'cand-3', name: 'Inès Fabre', email: 'ines.fabre@example.com', positionId: 'pos-2', stage: 'offer', appliedAt: '2026-08-19', offerApproved: false },
  { id: 'cand-4', name: 'Nicolas Petit', email: 'nicolas.petit@example.com', positionId: 'pos-3', stage: 'applied', appliedAt: '2026-09-10', offerApproved: false },
  { id: 'cand-5', name: 'Sarah Morel', email: 'sarah.morel@example.com', positionId: 'pos-3', stage: 'interview', appliedAt: '2026-09-05', offerApproved: false },
  { id: 'cand-6', name: 'Yanis Chevalier', email: 'yanis.chevalier@example.com', positionId: 'pos-2', stage: 'rejected', appliedAt: '2026-08-14', offerApproved: false },
  { id: 'cand-7', name: 'Élodie Vidal', email: 'elodie.vidal@example.com', positionId: 'pos-5', stage: 'hired', appliedAt: '2026-07-22', offerApproved: true },
  { id: 'cand-8', name: 'Mathis Blanc', email: 'mathis.blanc@example.com', positionId: 'pos-1', stage: 'applied', appliedAt: '2026-09-14', offerApproved: false },
];

const DEDUCTION_RATE = 0.22;
const monthlyNet = (annualGross: number) => Math.round((annualGross / 12) * (1 - DEDUCTION_RATE));

function managerName(managerId: string | null): string {
  return (managerId && EMPLOYEES.find((employee) => employee.id === managerId)?.name) || '—';
}

/** Public projection of a record: everything except the salary. */
function toMember(employee: EmployeeRecord): TeamMember {
  const { annualGross, ...member } = employee;
  void annualGross;
  return { ...member, managerName: managerName(employee.managerId) };
}

// --------------------------------------------------------------------- team

export type TeamScope = 'all' | 'team' | 'self';

/** What the caller may see of the directory, decided by their role's permissions. */
export function listTeam(user: User): { scope: TeamScope; members: TeamMember[] } {
  if (canAccess(user.role, 'TEAM', 'viewAll')) {
    return { scope: 'all', members: EMPLOYEES.map(toMember) };
  }
  if (canAccess(user.role, 'TEAM', 'viewOwnTeamOnly')) {
    return { scope: 'team', members: EMPLOYEES.filter((e) => e.teamId && e.teamId === user.teamId).map(toMember) };
  }
  return { scope: 'self', members: EMPLOYEES.filter((e) => e.id === user.id).map(toMember) };
}

// ------------------------------------------------------------------ payroll

export type PayrollScope = 'all' | 'team' | 'own';

/** Last `months` payslips of one employee, newest first. */
export function payslipsFor(employeeId: string, months = 6, now = new Date()): Payslip[] {
  const employee = EMPLOYEES.find((e) => e.id === employeeId);
  if (!employee) return [];

  return Array.from({ length: months }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index - 1, 1);
    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const gross = Math.round(employee.annualGross / 12);
    const bonus = date.getMonth() === 5 || date.getMonth() === 11 ? Math.round(gross * 0.5) : 0;
    const deductions = Math.round((gross + bonus) * DEDUCTION_RATE);
    return { id: `${employeeId}-${period}`, employeeId, period, gross, deductions, bonus, net: gross + bonus - deductions };
  });
}

function toRow(employee: EmployeeRecord): PayrollRow {
  return {
    id: employee.id,
    name: employee.name,
    department: employee.department,
    annualGross: employee.annualGross,
    monthlyNet: monthlyNet(employee.annualGross),
  };
}

/** Everyone's pay for `viewAll` roles, the team's for managers, only the caller's own payslips otherwise. */
export function listPayroll(user: User): { scope: PayrollScope; rows: PayrollRow[]; payslips: Payslip[] } {
  const payslips = payslipsFor(user.id);

  if (canAccess(user.role, 'PAYROLL', 'viewAll')) {
    return { scope: 'all', rows: EMPLOYEES.map(toRow), payslips };
  }
  if (canAccess(user.role, 'PAYROLL', 'viewOwnTeamOnly')) {
    const team = EMPLOYEES.filter((e) => e.teamId && e.teamId === user.teamId && e.id !== user.id);
    return { scope: 'team', rows: team.map(toRow), payslips };
  }
  return { scope: 'own', rows: [], payslips };
}
