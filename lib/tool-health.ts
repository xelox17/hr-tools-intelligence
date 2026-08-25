import DatabaseManager from '@/lib/database';

export interface ToolHealthRow {
  id: string;
  name: string;
  category: string;
  country: string;
  sync_status: string | null;
  last_sync: string | null;
  is_active: boolean;
  quality_score: string | null;
  total_records: number | null;
  invalid_records: number | null;
  successful_syncs_7d: string;
  failed_syncs_7d: string;
}

export type ToolStatus = 'healthy' | 'degraded' | 'failed';

export function computeToolStatus(
  row: Pick<ToolHealthRow, 'is_active' | 'sync_status'>,
  qualityScore: number | null,
  failedSyncs7d: number
): ToolStatus {
  if (!row.is_active || row.sync_status === 'failed') {
    return 'failed';
  }
  if (failedSyncs7d > 0 || (qualityScore !== null && qualityScore < 95)) {
    return 'degraded';
  }
  return 'healthy';
}

export async function fetchToolHealthRows(db: DatabaseManager): Promise<ToolHealthRow[]> {
  const result = await db.query<ToolHealthRow>(
    `SELECT
       t.id,
       t.name,
       t.category,
       t.country,
       t.sync_status,
       t.last_sync,
       t.is_active,
       dqm.quality_score,
       dqm.total_records,
       dqm.invalid_records,
       COALESCE(sync_stats.successful_syncs, 0) AS successful_syncs_7d,
       COALESCE(sync_stats.failed_syncs, 0) AS failed_syncs_7d
     FROM tools t
     LEFT JOIN data_quality_metrics dqm
       ON dqm.tool_id = t.id AND dqm.metric_date = CURRENT_DATE
     LEFT JOIN LATERAL (
       SELECT
         COUNT(*) FILTER (WHERE sl.status = 'success') AS successful_syncs,
         COUNT(*) FILTER (WHERE sl.status = 'failed') AS failed_syncs
       FROM sync_logs sl
       WHERE sl.tool_id = t.id AND sl.sync_start >= NOW() - INTERVAL '7 days'
     ) sync_stats ON true
     ORDER BY t.name`
  );
  return result.rows;
}
