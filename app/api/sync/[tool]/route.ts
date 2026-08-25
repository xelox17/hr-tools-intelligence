import { NextRequest, NextResponse } from 'next/server';
import DatabaseManager from '@/lib/database';
import {
  CornerStoneAPI,
  ADPApi,
  KelioAPI,
  type CornerstoneSyncResult,
  type ADPSyncResult,
  type KelioSyncResult,
} from '@/lib/connectors';
import { webhookManager } from '@/lib/webhooks';

type SyncTool = 'cornerstone' | 'adp' | 'kelio';

const TOOL_SLUGS: Record<SyncTool, string> = {
  cornerstone: 'cornerstone-lms',
  adp: 'adp-france',
  kelio: 'kelio',
};

function isSyncTool(value: string): value is SyncTool {
  return Object.prototype.hasOwnProperty.call(TOOL_SLUGS, value);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tool: string }> }
) {
  const { tool } = await params;

  if (!isSyncTool(tool)) {
    return NextResponse.json(
      {
        success: false,
        error: `Unknown sync tool "${tool}". Expected one of: cornerstone, adp, kelio.`,
      },
      { status: 400 }
    );
  }

  const db = DatabaseManager.getInstance();

  try {
    await db.connect();

    const toolLookup = await db.query('SELECT id FROM tools WHERE slug = $1', [
      TOOL_SLUGS[tool],
    ]);

    if (toolLookup.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: `Tool "${tool}" not found in tools table.` },
        { status: 404 }
      );
    }

    const toolId = toolLookup.rows[0].id;

    const syncLog = await db.query(
      `INSERT INTO sync_logs (tool_id, sync_type, sync_start, status, triggered_by)
       VALUES ($1, $2, NOW(), 'running', 'api')
       RETURNING id`,
      [toolId, tool]
    );
    const syncLogId = syncLog.rows[0].id;

    let recordsSynced: number;
    let recordsFailed: number;
    let errors: string[];
    let success: boolean;
    let payload: CornerstoneSyncResult | ADPSyncResult | KelioSyncResult;

    try {
      switch (tool) {
        case 'cornerstone': {
          const result = await new CornerStoneAPI().syncUsers();
          payload = result;
          recordsSynced = result.userssynced;
          recordsFailed = result.usersFailed;
          errors = result.errors;
          success = result.success;
          break;
        }
        case 'adp': {
          const result = await new ADPApi().syncEmployees();
          payload = result;
          recordsSynced = result.employeesSynced;
          recordsFailed = result.employeesFailed;
          errors = result.errors;
          success = result.success;
          break;
        }
        case 'kelio': {
          const result = await new KelioAPI().syncTimesheets();
          payload = result;
          recordsSynced = result.timesheetsSynced;
          recordsFailed = result.timeSheetsFailed;
          errors = result.errors;
          success = result.success;
          break;
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [sync/${tool}] Connector threw: ${message}`);

      await db.query(
        `UPDATE sync_logs
         SET sync_end = NOW(), status = 'failed', error_message = $1
         WHERE id = $2`,
        [message, syncLogId]
      );

      await db.query(`UPDATE tools SET sync_status = 'failed' WHERE id = $1`, [toolId]);

      webhookManager.trigger('sync.failed', { tool, error: message, syncId: syncLogId }).catch((err) => {
        const webhookMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`❌ [sync/${tool}] Failed to trigger sync.failed webhook: ${webhookMessage}`);
      });

      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }

    await db.query(
      `UPDATE sync_logs
       SET sync_end = NOW(), status = $1, records_synced = $2, records_failed = $3, error_message = $4
       WHERE id = $5`,
      [
        success ? 'success' : 'partial_failure',
        recordsSynced,
        recordsFailed,
        errors.length > 0 ? errors.join('; ').slice(0, 2000) : null,
        syncLogId,
      ]
    );

    await db.query(
      `UPDATE tools SET last_sync = NOW(), sync_status = $1 WHERE id = $2`,
      [success ? 'success' : 'partial_failure', toolId]
    );

    webhookManager
      .trigger('sync.completed', {
        tool,
        recordsSynced,
        recordsFailed,
        status: success ? 'success' : 'partial_failure',
        syncId: syncLogId,
      })
      .catch((err) => {
        const webhookMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`❌ [sync/${tool}] Failed to trigger sync.completed webhook: ${webhookMessage}`);
      });

    return NextResponse.json(payload, { status: success ? 200 : 207 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ [sync/${tool}] Sync failed: ${message}`);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
