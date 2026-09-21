"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  CalendarCheck,
  CalendarDays,
  Check,
  ClipboardList,
  FileText,
  Gauge,
  Hourglass,
  MessagesSquare,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { OpsDashboard } from "@/components/dashboard/OpsDashboard";
import { KpiCard } from "@/components/kpi-card";
import { ProtectedContent } from "@/components/auth/ProtectedContent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiResource } from "@/hooks/useApiResource";
import { usePayroll, useRecruitment, useTeam } from "@/hooks/useDemoData";
import { CANDIDATE_STAGES, formatEuro, type Candidate, type Position, type TeamMember } from "@/lib/auth/demo-data";
import { DEMO_USERS } from "@/lib/auth/demo-users";
import type { AccessLogEntry } from "@/lib/auth/middleware";
import type { User, UserRole } from "@/lib/auth/types";

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/** Shows a skeleton while loading, the error if the API refused, and `children` once the data is here. */
function WithData<T>({ state, children }: { state: ApiState<T>; children: (data: T) => ReactNode }) {
  if (state.loading) return <Skeleton className="h-40 w-full" />;
  if (state.error || !state.data) return <p role="alert" className="text-sm text-destructive">{state.error ?? "No data."}</p>;
  return <>{children(state.data)}</>;
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <ProtectedContent page="DASHBOARD" action="view">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </ProtectedContent>
  );
}

function KpiRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}

function SimpleList({ items, empty = "Nothing to show." }: { items: { id: string; primary: string; secondary?: string; trailing?: ReactNode }[]; empty?: string }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="flex flex-col divide-y divide-border">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">{item.primary}</span>
            {item.secondary && <span className="truncate text-xs text-muted-foreground">{item.secondary}</span>}
          </div>
          {item.trailing}
        </li>
      ))}
    </ul>
  );
}

const STAGE_LABELS: Record<string, string> = {
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

function PipelineFunnel({ candidates }: { candidates: Candidate[] }) {
  const counts = CANDIDATE_STAGES.map((stage) => ({ stage, count: candidates.filter((c) => c.stage === stage).length }));
  const max = Math.max(...counts.map((entry) => entry.count), 1);

  return (
    <ul className="flex flex-col gap-2" aria-label="Application funnel">
      {counts.map(({ stage, count }) => (
        <li key={stage} className="flex items-center gap-3 text-sm">
          <span className="w-20 shrink-0 text-muted-foreground">{STAGE_LABELS[stage]}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(count / max) * 100}%` }} />
          </div>
          <span className="w-5 text-right font-medium text-foreground">{count}</span>
        </li>
      ))}
    </ul>
  );
}

const isOpen = (position: Position) => position.status === "open";
const inPipeline = (candidate: Candidate) => candidate.stage !== "hired" && candidate.stage !== "rejected";
const positionTitle = (positions: Position[], id: string) => positions.find((p) => p.id === id)?.title;

function AdminDashboard() {
  const team = useTeam();
  const recruitment = useRecruitment();
  const denials = useApiResource<{ events: AccessLogEntry[] }>("/api/audit/access-log");

  return (
    <div className="flex flex-col gap-8">
      <WithData state={team}>
        {({ members }) => (
          <KpiRow>
            <KpiCard label="Total employees" value={members.length} icon={Users} />
            <KpiCard label="Departments" value={new Set(members.map((m) => m.department)).size} icon={Building2} />
            <KpiCard label="Active users" value={DEMO_USERS.length} icon={UserCheck} />
            <KpiCard label="Open positions" value={recruitment.data?.positions.filter(isOpen).length ?? "—"} icon={Briefcase} />
          </KpiRow>
        )}
      </WithData>
      <Section title="Recent activity" description="Latest denied access attempts recorded by the server.">
        <WithData state={denials}>
          {({ events }) => (
            <SimpleList
              empty="No denied attempts."
              items={events.slice(0, 6).map((entry) => ({
                id: entry.id,
                primary: `${entry.userName ?? entry.userRole} → ${entry.attemptedPage} (${entry.attemptedAction})`,
                secondary: new Date(entry.timestamp).toLocaleString(),
                trailing: <Badge variant="critical" size="sm">{entry.result}</Badge>,
              }))}
            />
          )}
        </WithData>
      </Section>
      <section aria-label="System health" className="flex flex-col gap-4">
        <h2 className="font-heading text-lg font-bold text-foreground">System health</h2>
        <OpsDashboard />
      </section>
    </div>
  );
}

const HR_REPORTS = [
  { href: "/recruitment", label: "Recruitment pipeline", icon: Briefcase },
  { href: "/payroll", label: "Payroll overview", icon: ClipboardList },
  { href: "/team", label: "Team directory", icon: Users },
  { href: "/policies", label: "HR policies", icon: FileText },
];

function RhManagerDashboard() {
  const team = useTeam();
  const recruitment = useRecruitment();

  return (
    <div className="flex flex-col gap-8">
      <WithData state={recruitment}>
        {({ positions, candidates }) => (
          <>
            <KpiRow>
              <KpiCard label="Employees" value={team.data?.members.length ?? "—"} icon={Users} />
              <KpiCard label="Open jobs" value={positions.filter(isOpen).length} icon={Briefcase} />
              <KpiCard label="Candidates in pipeline" value={candidates.filter(inPipeline).length} icon={UserPlus} />
              <KpiCard label="Offers to approve" value={candidates.filter((c) => c.stage === "offer" && !c.offerApproved).length} icon={Hourglass} />
            </KpiRow>
            <div className="grid gap-6 lg:grid-cols-2">
              <Section title="Recruitment pipeline"><PipelineFunnel candidates={candidates} /></Section>
              <Section title="Upcoming events & reviews">
                <SimpleList
                  items={[
                    { id: "e1", primary: "Mid-year reviews — IT", secondary: "Starts 6 Oct", trailing: <Badge variant="info" size="sm">Review</Badge> },
                    { id: "e2", primary: "Onboarding: 3 new joiners", secondary: "13 Oct", trailing: <Badge variant="success" size="sm">Event</Badge> },
                    { id: "e3", primary: "Policy refresh: remote work", secondary: "20 Oct", trailing: <Badge variant="warning" size="sm">Deadline</Badge> },
                  ]}
                />
              </Section>
            </div>
          </>
        )}
      </WithData>
      <Section title="Reports">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {HR_REPORTS.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted">
              <Icon className="h-4 w-4 text-primary" aria-hidden />
              {label}
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}

function RecruiterDashboard() {
  const recruitment = useRecruitment();

  return (
    <WithData state={recruitment}>
      {({ positions, candidates }) => {
        const interviews = candidates.filter((c) => c.stage === "interview");
        return (
          <div className="flex flex-col gap-8">
            <KpiRow>
              <KpiCard label="Open positions" value={positions.filter(isOpen).length} icon={Briefcase} />
              <KpiCard label="Candidates in pipeline" value={candidates.filter(inPipeline).length} icon={UserPlus} />
              <KpiCard label="Interviews scheduled" value={interviews.length} icon={CalendarCheck} />
              <KpiCard label="Avg. time to hire" value="21 days" icon={Gauge} />
            </KpiRow>
            <div className="grid gap-6 lg:grid-cols-2">
              <Section title="Application funnel"><PipelineFunnel candidates={candidates} /></Section>
              <Section title="Interviews scheduled">
                <SimpleList
                  empty="No interviews scheduled."
                  items={interviews.map((c) => ({ id: c.id, primary: c.name, secondary: positionTitle(positions, c.positionId) }))}
                />
              </Section>
            </div>
            <Section title="Recent candidates">
              <SimpleList
                items={[...candidates]
                  .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))
                  .slice(0, 5)
                  .map((c) => ({
                    id: c.id,
                    primary: c.name,
                    secondary: `${positionTitle(positions, c.positionId)} · applied ${c.appliedAt}`,
                    trailing: <Badge variant="secondary" size="sm">{STAGE_LABELS[c.stage]}</Badge>,
                  }))}
              />
            </Section>
          </div>
        );
      }}
    </WithData>
  );
}

const INITIAL_LEAVE_REQUESTS = [
  { id: "lv-1", name: "Léa Martin", detail: "3 days · 14–16 Oct" },
  { id: "lv-2", name: "Karim Benali", detail: "1 day · 22 Oct" },
];

function ManagerBoard({ members }: { members: TeamMember[] }) {
  const [requests, setRequests] = useState(INITIAL_LEAVE_REQUESTS);
  const resolve = (id: string) => setRequests((current) => current.filter((request) => request.id !== id));

  return (
    <div className="flex flex-col gap-8">
      <KpiRow>
        <KpiCard label="Team size" value={members.length} icon={Users} />
        <KpiCard label="Leave approvals pending" value={requests.length} icon={Hourglass} />
        <KpiCard label="Team performance" value="87%" icon={Gauge} />
        <KpiCard label="Reviews this quarter" value={members.length} icon={MessagesSquare} />
      </KpiRow>
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="My team">
          <SimpleList items={members.map((m) => ({ id: m.id, primary: m.name, secondary: m.title, trailing: <Badge variant="secondary" size="sm">{m.status}</Badge> }))} />
        </Section>
        <Section title="Leave approvals">
          <SimpleList
            empty="No pending requests."
            items={requests.map((request) => ({
              id: request.id,
              primary: request.name,
              secondary: request.detail,
              trailing: (
                <div className="flex gap-1">
                  <Button size="icon-xs" variant="outline" onClick={() => resolve(request.id)} aria-label={`Approve ${request.name}`}><Check /></Button>
                  <Button size="icon-xs" variant="outline" onClick={() => resolve(request.id)} aria-label={`Decline ${request.name}`}><X /></Button>
                </div>
              ),
            }))}
          />
        </Section>
      </div>
      <Section title="Team schedule" description="This week">
        <SimpleList
          items={[
            { id: "s1", primary: "Sprint planning", secondary: "Mon 10:00" },
            { id: "s2", primary: "1:1 reviews", secondary: "Wed 14:00" },
            { id: "s3", primary: "Team retrospective", secondary: "Fri 16:00" },
          ]}
        />
      </Section>
    </div>
  );
}

function ManagerDashboard({ user }: { user: User }) {
  const team = useTeam();
  return <WithData state={team}>{({ members }) => <ManagerBoard members={members.filter((m) => m.id !== user.id)} />}</WithData>;
}

function EmployeeDashboard({ user }: { user: User }) {
  const team = useTeam();
  const payroll = usePayroll();
  const leaveTaken = 7;
  const leaveTotal = 25;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="My profile">
          <WithData state={team}>
            {({ members }) => {
              const profile = members.find((m) => m.id === user.id);
              return (
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                  <dt className="text-muted-foreground">Name</dt><dd className="text-foreground">{user.name}</dd>
                  <dt className="text-muted-foreground">Title</dt><dd className="text-foreground">{profile?.title ?? "—"}</dd>
                  <dt className="text-muted-foreground">Department</dt><dd className="text-foreground">{user.department ?? "—"}</dd>
                  <dt className="text-muted-foreground">Email</dt><dd className="truncate text-foreground">{user.email}</dd>
                  <dt className="text-muted-foreground">Since</dt><dd className="text-foreground">{profile?.startDate ?? "—"}</dd>
                </dl>
              );
            }}
          </WithData>
        </Section>
        <Section title="My leave balance">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-foreground"><span className="font-heading text-2xl font-bold">{leaveTotal - leaveTaken}</span> of {leaveTotal} days remaining</p>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${leaveTaken} of ${leaveTotal} leave days taken`}>
              <div className="h-full rounded-full bg-primary" style={{ width: `${(leaveTaken / leaveTotal) * 100}%` }} />
            </div>
          </div>
        </Section>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Upcoming reviews">
          <SimpleList items={[{ id: "r1", primary: "Mid-year review", secondary: "With Sophie Manager · 8 Oct", trailing: <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden /> }]} />
        </Section>
        <Section title="My payslips" description="Last 3 months">
          <WithData state={payroll}>
            {({ payslips }) => (
              <>
                <SimpleList items={payslips.slice(0, 3).map((p) => ({ id: p.id, primary: p.period, secondary: `Net ${formatEuro(p.net)}` }))} />
                <Link href="/payroll" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">View all payslips</Link>
              </>
            )}
          </WithData>
        </Section>
      </div>
    </div>
  );
}

const HEADINGS: Record<UserRole, { title: string; subtitle: string }> = {
  ADMIN: { title: "Administration overview", subtitle: "Every area of the portal, plus system health." },
  RH_MANAGER: { title: "HR overview", subtitle: "Workforce, recruitment and upcoming HR events." },
  RECRUITER: { title: "Recruitment overview", subtitle: "Your open positions and candidate pipeline." },
  MANAGER: { title: "My team", subtitle: "Your team, approvals and schedule." },
  EMPLOYEE: { title: "My workspace", subtitle: "Your profile, leave and payslips." },
};

export function RoleDashboard({ user }: { user: User }) {
  const { title, subtitle } = HEADINGS[user.role];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </header>
      {user.role === "ADMIN" && <AdminDashboard />}
      {user.role === "RH_MANAGER" && <RhManagerDashboard />}
      {user.role === "RECRUITER" && <RecruiterDashboard />}
      {user.role === "MANAGER" && <ManagerDashboard user={user} />}
      {user.role === "EMPLOYEE" && <EmployeeDashboard user={user} />}
    </div>
  );
}
