"use client";

import { useState } from "react";
import { CheckCircle2, Download } from "lucide-react";
import { AccessGate } from "@/components/auth/AccessGate";
import { PermissionIndicator } from "@/components/auth/PermissionIndicator";
import { ProtectedContent } from "@/components/auth/ProtectedContent";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { showAlert } from "@/components/ui/alert";
import { usePayroll } from "@/hooks/useDemoData";
import { useAuth } from "@/lib/auth/hooks";
import { getPermissionLevel } from "@/lib/auth/roles";
import { formatEuro, type PayrollRow, type Payslip } from "@/lib/auth/demo-data";
import { downloadCSV } from "@/lib/csv";

const SCOPE_TEXT = {
  all: "Compensation for all employees.",
  team: "Compensation for your team, and your own payslips.",
  own: "Your payslips for the last 6 months.",
} as const;

/** Salary table for HR roles (all employees) and managers (their team). Edits and approval are local demo state. */
function SalaryTable({ rows, scope }: { rows: PayrollRow[]; scope: "all" | "team" }) {
  const [salaries, setSalaries] = useState<Record<string, number>>({});
  const [approved, setApproved] = useState(false);
  const gross = (row: PayrollRow) => salaries[row.id] ?? row.annualGross;
  const net = (row: PayrollRow) => Math.round((gross(row) / 12) * 0.78);

  const columns: DataTableColumn<PayrollRow>[] = [
    {
      id: "name",
      header: "Employee",
      sortValue: (r) => r.name,
      searchValue: (r) => `${r.name} ${r.department}`,
      cell: (r) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{r.name}</span>
          <span className="text-xs text-muted-foreground">{r.department}</span>
        </div>
      ),
    },
    {
      id: "gross",
      header: "Annual gross",
      sortValue: gross,
      cell: (r) => (
        <ProtectedContent page="PAYROLL" action="edit" fallback={formatEuro(gross(r))}>
          <Input
            aria-label={`Annual gross salary of ${r.name}`}
            type="number"
            min={0}
            value={gross(r)}
            onChange={(e) => setSalaries((c) => ({ ...c, [r.id]: Math.max(0, Number(e.target.value) || 0) }))}
            className="h-8 w-32"
          />
        </ProtectedContent>
      ),
    },
    { id: "net", header: "Monthly net (est.)", sortValue: net, cell: (r) => formatEuro(net(r)) },
  ];

  function exportCsv() {
    const lines = rows.map((r) => [r.name, r.department, gross(r), net(r)].join(","));
    downloadCSV("payroll.csv", ["Employee,Department,Annual gross (EUR),Monthly net est. (EUR)", ...lines].join("\n"));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap justify-end gap-2">
        <ProtectedContent page="PAYROLL" action="approve">
          <Button
            variant={approved ? "secondary" : "default"}
            onClick={() => {
              setApproved(true);
              showAlert({ type: "success", title: "Payroll run approved", description: "Demo: nothing is sent to a payroll system." });
            }}
            disabled={approved}
          >
            <CheckCircle2 />
            {approved ? "Payroll approved" : "Approve payroll run"}
          </Button>
        </ProtectedContent>
        {scope === "all" && (
          <Button variant="outline" onClick={exportCsv}><Download />Export CSV</Button>
        )}
      </div>
      <DataTable columns={columns} data={rows} getRowId={(r) => r.id} searchable searchPlaceholder="Search employees..." />
    </div>
  );
}

function PayslipTable({ payslips }: { payslips: Payslip[] }) {
  function download(payslip: Payslip) {
    downloadCSV(
      `payslip-${payslip.period}.csv`,
      ["Field,Value", `Period,${payslip.period}`, `Gross (EUR),${payslip.gross}`, `Bonus (EUR),${payslip.bonus}`, `Deductions (EUR),${payslip.deductions}`, `Net (EUR),${payslip.net}`].join("\n")
    );
  }

  const columns: DataTableColumn<Payslip>[] = [
    { id: "period", header: "Period", sortValue: (p) => p.period, cell: (p) => p.period },
    { id: "gross", header: "Gross", cell: (p) => formatEuro(p.gross + p.bonus) },
    { id: "deductions", header: "Deductions", cell: (p) => formatEuro(p.deductions) },
    { id: "net", header: "Net", cell: (p) => <span className="font-medium text-foreground">{formatEuro(p.net)}</span> },
  ];

  return (
    <DataTable
      columns={columns}
      data={payslips}
      getRowId={(p) => p.id}
      pageSize={6}
      rowActions={(p) => (
        <Button size="xs" variant="outline" onClick={() => download(p)} aria-label={`Download payslip ${p.period}`}>
          <Download />Download
        </Button>
      )}
    />
  );
}

function PayrollView() {
  const { role } = useAuth();
  const { data, loading, error } = usePayroll();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Payroll</h1>
          <p className="text-sm text-muted-foreground">{data ? SCOPE_TEXT[data.scope] : "Loading…"}</p>
        </div>
        {role && <PermissionIndicator level={getPermissionLevel(role, "PAYROLL")} showLabel />}
      </header>

      {loading && <Skeleton className="h-96 w-full" />}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {data && data.scope !== "own" && <SalaryTable rows={data.rows} scope={data.scope} />}
      {data && (
        <section aria-label="My payslips" className="flex flex-col gap-3">
          {data.scope !== "own" && <h2 className="font-heading text-lg font-semibold text-foreground">My payslips</h2>}
          <PayslipTable payslips={data.payslips} />
        </section>
      )}
    </div>
  );
}

export default function PayrollPage() {
  return (
    <AccessGate page="PAYROLL">
      <PayrollView />
    </AccessGate>
  );
}
