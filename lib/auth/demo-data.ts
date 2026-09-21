/**
 * Types and non-sensitive sample content shared with the browser. The
 * sensitive records (salaries, employee directory, candidates) live in
 * lib/server/demo-store.ts and only reach the client through the
 * role-scoped API routes.
 */

export type EmployeeStatus = "active" | "on-leave" | "remote";
export const EMPLOYEE_STATUSES: EmployeeStatus[] = ["active", "on-leave", "remote"];

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  department: string;
  title: string;
  managerId: string | null;
  managerName: string;
  teamId: string | null;
  startDate: string;
  status: EmployeeStatus;
  notes: string;
}

export interface PayrollRow {
  id: string;
  name: string;
  department: string;
  annualGross: number;
  monthlyNet: number;
}

export interface Payslip {
  id: string;
  employeeId: string;
  /** YYYY-MM */
  period: string;
  gross: number;
  deductions: number;
  bonus: number;
  net: number;
}

export type CandidateStage = "applied" | "screening" | "interview" | "offer" | "hired" | "rejected";
export const CANDIDATE_STAGES: CandidateStage[] = ["applied", "screening", "interview", "offer", "hired", "rejected"];

export interface Position {
  id: string;
  title: string;
  department: string;
  openings: number;
  status: "open" | "on-hold" | "closed";
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  positionId: string;
  stage: CandidateStage;
  appliedAt: string;
  offerApproved: boolean;
}

// ------------------------------------------------------------------- policies
// Policies are readable by every role, so they can ship with the page.

export interface HrPolicyDoc {
  id: string;
  title: string;
  category: string;
  summary: string;
  updatedAt: string;
}

export const INITIAL_POLICIES: HrPolicyDoc[] = [
  { id: "pol-leave", title: "Leave policy", category: "Leave", summary: "25 paid leave days per year, requested in SuccessFactors at least two weeks ahead for periods over five days.", updatedAt: "2026-03-01" },
  { id: "pol-remote", title: "Remote work policy", category: "Remote work", summary: "Up to two remote days per week, agreed with the manager. Core hours 10:00–16:00 apply on remote days.", updatedAt: "2026-05-15" },
  { id: "pol-conduct", title: "Code of conduct", category: "Conduct", summary: "Respect, integrity and safety come first. Concerns can be raised confidentially with HR or through the ethics line.", updatedAt: "2025-11-20" },
  { id: "pol-expenses", title: "Travel & expenses", category: "Finance", summary: "Pre-approval needed for travel over 500 EUR. Submit receipts within 30 days through the expense tool.", updatedAt: "2026-01-10" },
];

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount);
}
