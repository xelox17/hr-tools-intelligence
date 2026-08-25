import { NextRequest } from 'next/server';
import DatabaseManager from '@/lib/database';
import { successResponse, ErrorResponses } from '@/lib/response';

const VALID_SEVERITIES = ['critical', 'warning', 'info'];

interface AlertRuleRow {
  id: string;
  name: string;
  condition_type: string;
  threshold: string;
  severity: string;
  enabled: boolean;
  created_at: string;
}

interface CreateRuleBody {
  name?: string;
  condition?: string;
  threshold?: number;
  severity?: string;
  enabled?: boolean;
}

function toApiShape(row: AlertRuleRow) {
  return {
    id: row.id,
    name: row.name,
    condition: row.condition_type,
    threshold: Number(row.threshold),
    severity: row.severity,
    enabled: row.enabled,
    createdAt: row.created_at,
  };
}

export async function GET() {
  try {
    const db = DatabaseManager.getInstance();
    await db.connect();

    const result = await db.query<AlertRuleRow>(
      'SELECT id, name, condition_type, threshold, severity, enabled, created_at FROM alert_rules ORDER BY name'
    );

    return successResponse({ rules: result.rows.map(toApiShape) });
  } catch (error) {
    console.error('❌ Failed to list alert rules:', error);
    return ErrorResponses.internalError('Failed to list alert rules', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateRuleBody = await request.json();

    if (!body.name || typeof body.name !== 'string') {
      return ErrorResponses.badRequest('A "name" field is required.');
    }
    if (!body.condition || typeof body.condition !== 'string') {
      return ErrorResponses.badRequest('A "condition" field is required.');
    }
    if (typeof body.threshold !== 'number' || Number.isNaN(body.threshold)) {
      return ErrorResponses.badRequest('A numeric "threshold" field is required.');
    }
    if (!body.severity || !VALID_SEVERITIES.includes(body.severity)) {
      return ErrorResponses.badRequest(
        `A "severity" field is required and must be one of: ${VALID_SEVERITIES.join(', ')}.`
      );
    }

    const db = DatabaseManager.getInstance();
    await db.connect();

    const existing = await db.query('SELECT id FROM alert_rules WHERE name = $1', [body.name]);
    if (existing.rows.length > 0) {
      return ErrorResponses.conflict(`An alert rule named "${body.name}" already exists.`);
    }

    const result = await db.query<AlertRuleRow>(
      `INSERT INTO alert_rules (name, condition_type, threshold, severity, enabled)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, condition_type, threshold, severity, enabled, created_at`,
      [body.name, body.condition, body.threshold, body.severity, body.enabled ?? true]
    );

    return successResponse({ rule: toApiShape(result.rows[0]) }, undefined, 201);
  } catch (error) {
    console.error('❌ Failed to create alert rule:', error);
    return ErrorResponses.internalError('Failed to create alert rule', error);
  }
}
