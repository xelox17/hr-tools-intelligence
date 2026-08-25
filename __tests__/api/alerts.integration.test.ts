/**
 * Integration tests for the alerts routes against the real PostgreSQL
 * instance. POST /api/alerts/check runs the real AlertRuleEngine — its
 * API_TIMEOUT rule does hit the tools' (fake, unroutable) api_endpoint
 * hosts, but those fail fast via DNS (ENOTFOUND), not a real 30s wait.
 * Every row this suite creates is deleted again in afterEach/afterAll.
 */

import { GET as getActive } from '@/app/api/alerts/active/route';
import { PUT as putAcknowledge } from '@/app/api/alerts/acknowledge/route';
import { POST as postCheck } from '@/app/api/alerts/check/route';
import DatabaseManager from '@/lib/database';
import { buildRequest, readJson } from './helpers';

const TEST_MESSAGE_MARKER = 'jest-integration-test-alert';
let manuallyCreatedAlertIds: string[] = [];
let checkCreatedAlertIds: string[] = [];

async function insertTestAlert(): Promise<string> {
  const db = DatabaseManager.getInstance();
  await db.connect();
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO alerts (rule, tool_id, severity, message, status)
     VALUES ('NO_SYNC_24H', NULL, 'info', $1, 'open')
     RETURNING id`,
    [TEST_MESSAGE_MARKER]
  );
  return rows[0].id;
}

afterEach(async () => {
  const db = DatabaseManager.getInstance();
  await db.connect();
  const allIds = [...manuallyCreatedAlertIds, ...checkCreatedAlertIds];
  if (allIds.length > 0) {
    await db.query('DELETE FROM alerts WHERE id = ANY($1)', [allIds]);
  }
  manuallyCreatedAlertIds = [];
  checkCreatedAlertIds = [];
});

afterAll(async () => {
  await DatabaseManager.getInstance().close();
});

describe('GET /api/alerts/active (integration)', () => {
  it('returns only alerts with status = open, most recent first', async () => {
    const alertId = await insertTestAlert();
    manuallyCreatedAlertIds.push(alertId);

    const response = await getActive();
    const body = await readJson<{
      success: boolean;
      data: { alerts: { id: string; status: string; message: string }[]; count: number };
    }>(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    const created = body.data.alerts.find((a) => a.id === alertId);
    expect(created).toBeDefined();
    expect(created?.status).toBe('open');
    expect(body.data.count).toBe(body.data.alerts.length);
  });
});

describe('PUT /api/alerts/acknowledge (integration)', () => {
  it('acknowledges an open alert and stamps acknowledged_at/acknowledged_by', async () => {
    const alertId = await insertTestAlert();
    manuallyCreatedAlertIds.push(alertId);

    const response = await putAcknowledge(
      buildRequest('/api/alerts/acknowledge', {
        method: 'PUT',
        body: { alertId, acknowledgedBy: 'jest@lesaffre.com' },
      })
    );
    const body = await readJson<{
      success: boolean;
      data: { alert: { status: string; acknowledged_by: string; acknowledged_at: string } };
    }>(response);

    expect(response.status).toBe(200);
    expect(body.data.alert.status).toBe('acknowledged');
    expect(body.data.alert.acknowledged_by).toBe('jest@lesaffre.com');
    expect(new Date(body.data.alert.acknowledged_at).toString()).not.toBe('Invalid Date');
  });

  it('returns 404 when acknowledging an alert that is already acknowledged (or does not exist)', async () => {
    const alertId = await insertTestAlert();
    manuallyCreatedAlertIds.push(alertId);

    await putAcknowledge(
      buildRequest('/api/alerts/acknowledge', {
        method: 'PUT',
        body: { alertId, acknowledgedBy: 'jest@lesaffre.com' },
      })
    );
    const secondAttempt = await putAcknowledge(
      buildRequest('/api/alerts/acknowledge', {
        method: 'PUT',
        body: { alertId, acknowledgedBy: 'someone-else@lesaffre.com' },
      })
    );

    expect(secondAttempt.status).toBe(404);
  });

  it('returns 400 when acknowledgedBy is missing', async () => {
    const alertId = await insertTestAlert();
    manuallyCreatedAlertIds.push(alertId);

    const response = await putAcknowledge(
      buildRequest('/api/alerts/acknowledge', { method: 'PUT', body: { alertId } })
    );

    expect(response.status).toBe(400);
  });
});

describe('POST /api/alerts/check (integration)', () => {
  it('runs the real rule engine against the seeded tools and returns a well-formed summary', async () => {
    const response = await postCheck();
    const body = await readJson<{
      success: boolean;
      data: { evaluated: number; triggered: number; created: number; skipped: number; alerts: { id: string }[] };
    }>(response);

    checkCreatedAlertIds = body.data.alerts.map((a) => a.id);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.evaluated).toBeGreaterThan(0);
    expect(body.data.created + body.data.skipped).toBe(body.data.triggered);
    expect(body.data.alerts).toHaveLength(body.data.created);
  }, 15000);

  it('does not create a duplicate open alert for the same rule+tool on a second run', async () => {
    const first = await readJson<{ data: { alerts: { id: string }[] } }>(await postCheck());
    checkCreatedAlertIds = first.data.alerts.map((a) => a.id);

    const second = await readJson<{ data: { created: number; skipped: number; triggered: number } }>(
      await postCheck()
    );

    // Whatever triggered on the second run must all be skips (already open from the first run).
    expect(second.data.created).toBe(0);
    expect(second.data.skipped).toBe(second.data.triggered);
  }, 15000);
});
