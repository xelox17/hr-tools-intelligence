/**
 * Integration test for GET /api/health.
 *
 * Calls the real route handler against the real PostgreSQL instance
 * configured via DB_* env vars (same database the app itself uses in
 * dev — see docs/TESTING.md). No mocking: this proves the handler, the
 * DatabaseManager singleton, and an actual live database round-trip all
 * work together.
 */

import { GET } from '@/app/api/health/route';
import DatabaseManager from '@/lib/database';
import { readJson } from './helpers';

afterAll(async () => {
  await DatabaseManager.getInstance().close();
});

describe('GET /api/health (integration)', () => {
  it('returns 200 with a healthy status and a live database round-trip', async () => {
    const response = await GET();
    const body = await readJson<{
      success: boolean;
      data: {
        status: string;
        version: string;
        uptime: number;
        database: { connected: boolean; responseTime_ms: number };
        timestamp: string;
      };
    }>(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('healthy');
    expect(body.data.version).toBe('1.0.0');
    expect(body.data.database.connected).toBe(true);
    expect(body.data.database.responseTime_ms).toBeGreaterThanOrEqual(0);
    expect(typeof body.data.uptime).toBe('number');
    expect(new Date(body.data.timestamp).toString()).not.toBe('Invalid Date');
  });
});
