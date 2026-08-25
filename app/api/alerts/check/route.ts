import DatabaseManager from '@/lib/database';
import { successResponse, ErrorResponses } from '@/lib/response';
import { AlertRuleEngine, type AlertRuleResult } from '@/lib/alerts/rules';
import { webhookManager } from '@/lib/webhooks';

interface CreatedAlertRow {
  id: string;
  rule: string;
  tool_id: string | null;
  severity: string;
  message: string;
  status: string;
  created_at: string;
}

async function hasOpenAlert(
  db: DatabaseManager,
  rule: string,
  toolId: string | null
): Promise<boolean> {
  const result = await db.query(
    `SELECT id FROM alerts
     WHERE rule = $1 AND status = 'open' AND tool_id IS NOT DISTINCT FROM $2`,
    [rule, toolId]
  );
  return result.rows.length > 0;
}

export async function POST() {
  try {
    const db = DatabaseManager.getInstance();
    await db.connect();

    const engine = new AlertRuleEngine();
    const results = await engine.evaluate();
    const triggered = results.filter((result) => result.triggered);

    const createdAlerts: CreatedAlertRow[] = [];
    let skipped = 0;

    for (const result of triggered) {
      const alreadyOpen = await hasOpenAlert(db, result.rule, result.toolId);
      if (alreadyOpen) {
        skipped++;
        continue;
      }

      const inserted = await db.query<CreatedAlertRow>(
        `INSERT INTO alerts (rule, tool_id, severity, message, status)
         VALUES ($1, $2, $3, $4, 'open')
         RETURNING id, rule, tool_id, severity, message, status, created_at`,
        [result.rule, result.toolId, result.severity, result.message]
      );
      createdAlerts.push(inserted.rows[0]);
    }

    for (const alert of createdAlerts) {
      const triggeredResult = triggered.find(
        (r): r is AlertRuleResult => r.rule === alert.rule && r.toolId === alert.tool_id
      );

      webhookManager
        .trigger('alert.triggered', {
          alertId: alert.id,
          rule: alert.rule,
          tool: triggeredResult?.tool ?? null,
          severity: alert.severity,
          message: alert.message,
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : 'Unknown error';
          console.error(`❌ [alerts/check] Failed to trigger alert.triggered webhook: ${message}`);
        });
    }

    return successResponse({
      evaluated: results.length,
      triggered: triggered.length,
      created: createdAlerts.length,
      skipped,
      alerts: createdAlerts,
    });
  } catch (error) {
    console.error('❌ Alert check failed:', error);
    return ErrorResponses.internalError('Alert check failed', error);
  }
}
