import DatabaseManager from '@/lib/database';
import { successResponse, ErrorResponses } from '@/lib/response';

interface EmployeeCountsRow {
  total: string;
  valid: string;
}

interface TopIssueRow {
  issue: string;
  count: string;
}

export async function GET() {
  try {
    const db = DatabaseManager.getInstance();
    await db.connect();

    const countsResult = await db.query<EmployeeCountsRow>(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE data_quality_score = 100) AS valid
       FROM employees`
    );

    const totalEmployees = Number(countsResult.rows[0]?.total ?? 0);
    const validEmployees = Number(countsResult.rows[0]?.valid ?? 0);
    const employeesWithIssues = totalEmployees - validEmployees;
    const percentageValid =
      totalEmployees > 0 ? Math.round((validEmployees / totalEmployees) * 10000) / 100 : 0;

    const topIssuesResult = await db.query<TopIssueRow>(
      `SELECT issue_type AS issue, COUNT(*) AS count
       FROM employee_issues
       WHERE status = 'open'
       GROUP BY issue_type
       ORDER BY count DESC
       LIMIT 5`
    );

    const topIssues = topIssuesResult.rows.map((row) => ({
      issue: row.issue,
      count: Number(row.count),
    }));

    return successResponse({
      totalEmployees,
      validEmployees,
      employeesWithIssues,
      percentageValid,
      topIssues,
    });
  } catch (error) {
    console.error('❌ Data quality query failed:', error);
    return ErrorResponses.internalError('Failed to fetch data quality summary', error);
  }
}
