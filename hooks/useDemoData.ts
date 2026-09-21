"use client";

import { useApiResource } from "@/hooks/useApiResource";
import type { Candidate, PayrollRow, Payslip, Position, TeamMember } from "@/lib/auth/demo-data";

export const useTeam = () => useApiResource<{ scope: "all" | "team" | "self"; members: TeamMember[] }>("/api/team");

export const usePayroll = () =>
  useApiResource<{ scope: "all" | "team" | "own"; rows: PayrollRow[]; payslips: Payslip[] }>("/api/payroll");

export const useRecruitment = () =>
  useApiResource<{ positions: Position[]; candidates: Candidate[] }>("/api/recruitment");
