import { NextRequest } from 'next/server';
import DatabaseManager from '@/lib/database';
import { successResponse, ErrorResponses } from '@/lib/response';

interface ToolRow {
  id: string;
  name: string;
  category: string;
}

interface QualityTrendRow {
  metric_date: string;
  quality_score: string;
  total_records: number;
  invalid_records: number;
  top_issues: string[] | null;
}

interface SyncLogRow {
  id: number;
  sync_start: string;
  sync_end: string | null;
  status: string;
  records_synced: number;
  records_failed: number;
  error_message: string | null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ toolId: string }> }) {
  try {
    const { toolId } = await params;
    const db = DatabaseManager.getInstance();
    await db.connect();

    const toolResult = await db.query<ToolRow>('SELECT id, name, category FROM tools WHERE id = $1', [toolId]);
    if (toolResult.rows.length === 0) {
      return ErrorResponses.notFound(`Tool "${toolId}"`);
    }

    const qualityTrendResult = await db.query<QualityTrendRow>(
      `SELECT metric_date, quality_score, total_records, invalid_records, top_issues
       FROM data_quality_metrics
       WHERE tool_id = $1 AND metric_date >= CURRENT_DATE - INTERVAL '7 days'
       ORDER BY metric_date ASC`,
      [toolId]
    );

    const syncLogsResult = await db.query<SyncLogRow>(
      `SELECT id, sync_start, sync_end, status, records_synced, records_failed, error_message
       FROM sync_logs
       WHERE tool_id = $1 AND sync_start >= NOW() - INTERVAL '7 days'
       ORDER BY sync_start DESC
       LIMIT 50`,
      [toolId]
    );

    return successResponse({
      tool: toolResult.rows[0],
      qualityTrend: qualityTrendResult.rows.map((row) => ({
        date: row.metric_date,
        qualityScore: Number(row.quality_score),
        totalRecords: row.total_records,
        invalidRecords: row.invalid_records,
        topIssues: row.top_issues ?? [],
      })),
      syncLogs: syncLogsResult.rows.map((row) => ({
        id: row.id,
        syncStart: row.sync_start,
        syncEnd: row.sync_end,
        status: row.status,
        recordsSynced: row.records_synced,
        recordsFailed: row.records_failed,
        errorMessage: row.error_message,
      })),
    });
  } catch (error) {
    console.error('❌ Failed to fetch tool health detail:', error);
    return ErrorResponses.internalError('Failed to fetch tool health detail', error);
  }
}
