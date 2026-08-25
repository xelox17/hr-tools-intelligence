/**
 * Integration tests for the read-only analytics routes, against the real
 * PostgreSQL instance (no mocking — these just need real seeded tools).
 */

import { GET as getToolHealth } from '@/app/api/analytics/tool-health/route';
import { GET as getDataQuality } from '@/app/api/analytics/data-quality/route';
import DatabaseManager from '@/lib/database';
import { readJson } from './helpers';

afterAll(async () => {
  await DatabaseManager.getInstance().close();
});

describe('GET /api/analytics/tool-health (integration)', () => {
  it('returns a status/quality/sync summary for every active tool', async () => {
    const response = await getToolHealth();
    const body = await readJson<{
      success: boolean;
      data: {
        tools: {
          name: string;
          status: string;
          qualityScore: number | null;
          successfulSyncs7d: number;
          failedSyncs7d: number;
        }[];
        lastUpdated: string;
      };
    }>(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.tools.length).toBeGreaterThan(0);

    for (const tool of body.data.tools) {
      expect(['healthy', 'degraded', 'failed']).toContain(tool.status);
      expect(typeof tool.successfulSyncs7d).toBe('number');
      expect(typeof tool.failedSyncs7d).toBe('number');
    }
    expect(new Date(body.data.lastUpdated).toString()).not.toBe('Invalid Date');
  });
});

describe('GET /api/analytics/data-quality (integration)', () => {
  it('returns totals that are internally consistent', async () => {
    const response = await getDataQuality();
    const body = await readJson<{
      success: boolean;
      data: {
        totalEmployees: number;
        validEmployees: number;
        employeesWithIssues: number;
        percentageValid: number;
        topIssues: { issue: string; count: number }[];
      };
    }>(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    const { totalEmployees, validEmployees, employeesWithIssues, percentageValid, topIssues } = body.data;
    expect(validEmployees + employeesWithIssues).toBe(totalEmployees);
    expect(percentageValid).toBeGreaterThanOrEqual(0);
    expect(percentageValid).toBeLessThanOrEqual(100);
    expect(topIssues.length).toBeLessThanOrEqual(5);
    for (const issue of topIssues) {
      expect(typeof issue.issue).toBe('string');
      expect(typeof issue.count).toBe('number');
    }
  });
});
