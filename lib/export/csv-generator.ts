import { Readable } from 'node:stream';
import DatabaseManager from '@/lib/database';
import { computeToolStatus, fetchToolHealthRows } from '@/lib/tool-health';

const CSV_BOM = '﻿';

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const str = value instanceof Date ? value.toISOString() : String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

function csvRow(values: unknown[]): string {
  return values.map(csvEscape).join(',') + '\r\n';
}

export interface AlertsDateRange {
  from?: string;
  to?: string;
}

interface EmployeeReportRow {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  department: string | null;
  hire_date: string | null;
  quality_score: number | null;
  issues_count: string;
}

interface AlertReportRow {
  rule: string;
  tool: string | null;
  severity: string;
  message: string;
  status: string;
  created_at: string;
}

export class CSVGenerator {
  async generateToolsReport(): Promise<Readable> {
    const db = DatabaseManager.getInstance();
    await db.connect();
    const rows = await fetchToolHealthRows(db);

    const headers = ['name', 'category', 'country', 'status', 'quality_score', 'last_sync', 'sync_count_7d'];

    return Readable.from(
      (async function* () {
        yield CSV_BOM;
        yield csvRow(headers);
        for (const row of rows) {
          const qualityScore = row.quality_score !== null ? Number(row.quality_score) : null;
          const successfulSyncs7d = Number(row.successful_syncs_7d);
          const failedSyncs7d = Number(row.failed_syncs_7d);
          const status = computeToolStatus(row, qualityScore, failedSyncs7d);

          yield csvRow([
            row.name,
            row.category,
            row.country,
            status,
            qualityScore,
            row.last_sync,
            successfulSyncs7d + failedSyncs7d,
          ]);
        }
      })(),
      { objectMode: false }
    );
  }

  async generateEmployeesReport(): Promise<Readable> {
    const db = DatabaseManager.getInstance();
    await db.connect();

    const result = await db.query<EmployeeReportRow>(
      `SELECT
         e.first_name,
         e.last_name,
         e.email,
         e.department,
         e.hire_date,
         e.data_quality_score AS quality_score,
         COUNT(ei.id) FILTER (WHERE ei.status = 'open') AS issues_count
       FROM employees e
       LEFT JOIN employee_issues ei ON ei.employee_id = e.id
       GROUP BY e.id
       ORDER BY e.last_name NULLS LAST, e.first_name NULLS LAST`
    );

    const headers = [
      'first_name',
      'last_name',
      'email',
      'department',
      'hire_date',
      'quality_score',
      'issues_count',
    ];

    return Readable.from(
      (async function* () {
        yield CSV_BOM;
        yield csvRow(headers);
        for (const row of result.rows) {
          yield csvRow([
            row.first_name,
            row.last_name,
            row.email,
            row.department,
            row.hire_date,
            row.quality_score,
            Number(row.issues_count),
          ]);
        }
      })(),
      { objectMode: false }
    );
  }

  async generateAlertsReport(dateRange?: AlertsDateRange): Promise<Readable> {
    const db = DatabaseManager.getInstance();
    await db.connect();

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (dateRange?.from) {
      params.push(dateRange.from);
      conditions.push(`a.created_at >= $${params.length}`);
    }
    if (dateRange?.to) {
      params.push(dateRange.to);
      conditions.push(`a.created_at <= $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await db.query<AlertReportRow>(
      `SELECT a.rule, t.slug AS tool, a.severity, a.message, a.status, a.created_at
       FROM alerts a
       LEFT JOIN tools t ON t.id = a.tool_id
       ${whereClause}
       ORDER BY a.created_at DESC`,
      params
    );

    const headers = ['rule', 'tool', 'severity', 'message', 'status', 'created_at'];

    return Readable.from(
      (async function* () {
        yield CSV_BOM;
        yield csvRow(headers);
        for (const row of result.rows) {
          yield csvRow([row.rule, row.tool, row.severity, row.message, row.status, row.created_at]);
        }
      })(),
      { objectMode: false }
    );
  }
}
