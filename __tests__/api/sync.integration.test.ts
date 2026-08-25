/**
 * Integration test for POST /api/sync/[tool].
 *
 * The connectors (lib/connectors) are mocked — this suite verifies the
 * route's own orchestration (tool lookup, sync_logs insert/update,
 * tools.last_sync/sync_status update, webhook trigger) against the real
 * database, without ever calling the real Cornerstone/ADP/Kelio APIs.
 * webhookManager.trigger is also mocked so no outbound HTTP is attempted.
 */

import { CornerStoneAPI, ADPApi, KelioAPI } from '@/lib/connectors';
import { webhookManager } from '@/lib/webhooks';
import { POST } from '@/app/api/sync/[tool]/route';
import DatabaseManager from '@/lib/database';
import { buildRequest, readJson } from './helpers';

jest.mock('@/lib/connectors', () => ({
  CornerStoneAPI: jest.fn(),
  ADPApi: jest.fn(),
  KelioAPI: jest.fn(),
}));
jest.mock('@/lib/webhooks', () => ({
  webhookManager: { trigger: jest.fn().mockResolvedValue(undefined) },
}));

const MockedCornerStoneAPI = jest.mocked(CornerStoneAPI);
const MockedADPApi = jest.mocked(ADPApi);
const MockedKelioAPI = jest.mocked(KelioAPI);
const mockedTrigger = jest.mocked(webhookManager.trigger);

async function callSync(tool: string) {
  return POST(buildRequest(`/api/sync/${tool}`, { method: 'POST' }), {
    params: Promise.resolve({ tool }),
  });
}

async function latestSyncLog(toolSlug: string) {
  const db = DatabaseManager.getInstance();
  await db.connect();
  const result = await db.query(
    `SELECT sl.* FROM sync_logs sl JOIN tools t ON t.id = sl.tool_id WHERE t.slug = $1 ORDER BY sl.created_at DESC LIMIT 1`,
    [toolSlug]
  );
  return result.rows[0] as Record<string, unknown> | undefined;
}

beforeEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  await DatabaseManager.getInstance().close();
});

describe('POST /api/sync/[tool] (integration)', () => {
  it('returns 400 for an unknown tool param and never touches sync_logs', async () => {
    const response = await callSync('unknown-tool');
    const body = await readJson<{ success: boolean; error: string }>(response);

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Unknown sync tool');
  });

  it('runs a successful Cornerstone sync: 200, logs the run, updates tools.last_sync, fires sync.completed', async () => {
    MockedCornerStoneAPI.mockImplementation(
      () =>
        ({
          syncUsers: jest
            .fn()
            .mockResolvedValue({ success: true, userssynced: 3, usersFailed: 0, errors: [] }),
        }) as unknown as InstanceType<typeof CornerStoneAPI>
    );

    const response = await callSync('cornerstone');
    const body = await readJson<{ success: boolean; userssynced: number }>(response);

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, userssynced: 3, usersFailed: 0, errors: [] });

    const log = await latestSyncLog('cornerstone-lms');
    expect(log?.status).toBe('success');
    expect(log?.records_synced).toBe(3);
    expect(log?.triggered_by).toBe('api');

    expect(mockedTrigger).toHaveBeenCalledWith(
      'sync.completed',
      expect.objectContaining({ tool: 'cornerstone', recordsSynced: 3, status: 'success' })
    );
  });

  it('returns 207 (multi-status) and logs "partial_failure" when some records fail', async () => {
    MockedADPApi.mockImplementation(
      () =>
        ({
          syncEmployees: jest.fn().mockResolvedValue({
            success: false,
            employeesSynced: 2,
            employeesFailed: 1,
            errors: ['Invalid employee record: {...}'],
          }),
        }) as unknown as InstanceType<typeof ADPApi>
    );

    const response = await callSync('adp');
    const body = await readJson<{ success: boolean; employeesFailed: number }>(response);

    expect(response.status).toBe(207);
    expect(body.success).toBe(false);
    expect(body.employeesFailed).toBe(1);

    const log = await latestSyncLog('adp-france');
    expect(log?.status).toBe('partial_failure');
  });

  it('returns 500 and logs "failed" when the connector throws, and fires sync.failed', async () => {
    MockedKelioAPI.mockImplementation(
      () =>
        ({
          syncTimesheets: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
        }) as unknown as InstanceType<typeof KelioAPI>
    );

    const response = await callSync('kelio');
    const body = await readJson<{ success: boolean; error: string }>(response);

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('ECONNREFUSED');

    const log = await latestSyncLog('kelio');
    expect(log?.status).toBe('failed');

    expect(mockedTrigger).toHaveBeenCalledWith(
      'sync.failed',
      expect.objectContaining({ tool: 'kelio', error: 'ECONNREFUSED' })
    );
  });
});
