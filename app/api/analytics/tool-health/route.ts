import DatabaseManager from '@/lib/database';
import { successResponse, ErrorResponses } from '@/lib/response';
import { computeToolStatus, fetchToolHealthRows } from '@/lib/tool-health';

export async function GET() {
  try {
    const db = DatabaseManager.getInstance();
    await db.connect();

    const rows = await fetchToolHealthRows(db);

    const tools = rows.map((row) => {
      const qualityScore = row.quality_score !== null ? Number(row.quality_score) : null;
      const successfulSyncs7d = Number(row.successful_syncs_7d);
      const failedSyncs7d = Number(row.failed_syncs_7d);

      return {
        name: row.name,
        status: computeToolStatus(row, qualityScore, failedSyncs7d),
        lastSync: row.last_sync,
        qualityScore,
        successfulSyncs7d,
        failedSyncs7d,
      };
    });

    return successResponse({
      tools,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Tool health query failed:', error);
    return ErrorResponses.internalError('Failed to fetch tool health', error);
  }
}
