/**
 * Unit tests for AlertRuleEngine (lib/alerts/rules.ts).
 *
 * DatabaseManager is mocked with a router keyed on distinctive substrings
 * of each query's SQL text (the engine fires several queries concurrently
 * via Promise.all, so a strict call-order mock would be flaky). axios is
 * mocked for the API_TIMEOUT rule, which is the only rule that makes an
 * HTTP call instead of a DB query.
 */

import axios from 'axios';
import DatabaseManager from '@/lib/database';
import { AlertRuleEngine, type AlertRuleName } from '@/lib/alerts/rules';

jest.mock('@/lib/database');
jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

const RULE_DEFAULTS: Record<AlertRuleName, { threshold: number; severity: string }> = {
  QUALITY_DEGRADATION: { threshold: 80, severity: 'warning' },
  SYNC_FAILURE_STREAK: { threshold: 3, severity: 'critical' },
  NO_SYNC_24H: { threshold: 24, severity: 'critical' },
  HIGH_ISSUE_RATE: { threshold: 10, severity: 'critical' },
  API_TIMEOUT: { threshold: 30000, severity: 'warning' },
};

function ruleRowsWithOnly(enabledRule: AlertRuleName) {
  return (Object.keys(RULE_DEFAULTS) as AlertRuleName[]).map((name) => ({
    name,
    threshold: String(RULE_DEFAULTS[name].threshold),
    severity: RULE_DEFAULTS[name].severity,
    enabled: name === enabledRule,
  }));
}

interface Tool {
  id: string;
  name: string;
  slug: string;
  api_endpoint: string | null;
}

const TOOL: Tool = { id: 'tool-1', name: 'Cornerstone LMS', slug: 'cornerstone-lms', api_endpoint: null };

interface DbFixture {
  ruleRows?: unknown[];
  tools?: Tool[];
  qualityScore?: number | null | 'MISSING';
  syncLogStatuses?: string[];
  lastSync?: string | null;
  totalEmployees?: number;
  criticalIssues?: number;
}

function makeMockDb(fixture: DbFixture) {
  const query = jest.fn(async (sql: string) => {
    if (sql.includes('FROM alert_rules')) {
      return { rows: fixture.ruleRows ?? [] };
    }
    if (sql.includes('FROM tools WHERE is_active')) {
      return { rows: fixture.tools ?? [TOOL] };
    }
    if (sql.includes('FROM data_quality_metrics')) {
      if (fixture.qualityScore === undefined || fixture.qualityScore === 'MISSING') {
        return { rows: [] };
      }
      return { rows: [{ quality_score: String(fixture.qualityScore) }] };
    }
    if (sql.includes('FROM sync_logs') && sql.includes('ORDER BY sync_start DESC')) {
      return { rows: (fixture.syncLogStatuses ?? []).map((status) => ({ status })) };
    }
    if (sql.includes('MAX(sync_start)')) {
      return { rows: [{ last_sync: fixture.lastSync ?? null }] };
    }
    if (sql.includes('FROM employees')) {
      return { rows: [{ total: String(fixture.totalEmployees ?? 0) }] };
    }
    if (sql.includes('FROM employee_issues')) {
      return { rows: [{ count: String(fixture.criticalIssues ?? 0) }] };
    }
    throw new Error(`Unexpected query in test fixture: ${sql}`);
  });

  return { connect: jest.fn().mockResolvedValue(undefined), query };
}

function hoursAgoIso(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

async function evaluateSingleRule(rule: AlertRuleName, fixture: Omit<DbFixture, 'ruleRows'>) {
  const db = makeMockDb({ ...fixture, ruleRows: ruleRowsWithOnly(rule) });
  (DatabaseManager.getInstance as jest.Mock).mockReturnValue(db);

  const engine = new AlertRuleEngine();
  const results = await engine.evaluate();
  return results.filter((r) => r.rule === rule);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AlertRuleEngine — QUALITY_DEGRADATION (score < 80)', () => {
  it('triggers when the quality score is below the threshold', async () => {
    const [result] = await evaluateSingleRule('QUALITY_DEGRADATION', { qualityScore: 65 });

    expect(result.triggered).toBe(true);
    expect(result.severity).toBe('warning');
    expect(result.tool).toBe('cornerstone-lms');
    expect(result.message).toContain('dropped to 65%');
  });

  it('does not trigger when the quality score is at or above the threshold', async () => {
    const [result] = await evaluateSingleRule('QUALITY_DEGRADATION', { qualityScore: 91 });

    expect(result.triggered).toBe(false);
  });

  it('does not trigger when there is no quality data for today', async () => {
    const [result] = await evaluateSingleRule('QUALITY_DEGRADATION', { qualityScore: 'MISSING' });

    expect(result.triggered).toBe(false);
    expect(result.message).toContain('No quality data');
  });
});

describe('AlertRuleEngine — SYNC_FAILURE_STREAK (3 fails in a row)', () => {
  it('triggers when the last 3 syncs all failed', async () => {
    const [result] = await evaluateSingleRule('SYNC_FAILURE_STREAK', {
      syncLogStatuses: ['failed', 'failed', 'failed'],
    });

    expect(result.triggered).toBe(true);
    expect(result.severity).toBe('critical');
    expect(result.message).toContain('failed its last 3 syncs');
  });

  it('does not trigger when one of the last 3 syncs succeeded', async () => {
    const [result] = await evaluateSingleRule('SYNC_FAILURE_STREAK', {
      syncLogStatuses: ['failed', 'success', 'failed'],
    });

    expect(result.triggered).toBe(false);
  });

  it('does not trigger when there are fewer than 3 sync attempts yet', async () => {
    const [result] = await evaluateSingleRule('SYNC_FAILURE_STREAK', {
      syncLogStatuses: ['failed', 'failed'],
    });

    expect(result.triggered).toBe(false);
  });
});

describe('AlertRuleEngine — NO_SYNC_24H (no sync in > 24h)', () => {
  it('triggers when the last sync was more than 24 hours ago', async () => {
    const [result] = await evaluateSingleRule('NO_SYNC_24H', { lastSync: hoursAgoIso(30) });

    expect(result.triggered).toBe(true);
    expect(result.message).toContain('30 hours');
  });

  it('does not trigger when the last sync was within the last 24 hours', async () => {
    const [result] = await evaluateSingleRule('NO_SYNC_24H', { lastSync: hoursAgoIso(2) });

    expect(result.triggered).toBe(false);
  });

  it('triggers when the tool has never synced', async () => {
    const [result] = await evaluateSingleRule('NO_SYNC_24H', { lastSync: null });

    expect(result.triggered).toBe(true);
    expect(result.message).toContain('never synced');
  });
});

describe('AlertRuleEngine — HIGH_ISSUE_RATE (> 10% of employees)', () => {
  it('triggers when more than 10% of employees have critical open issues', async () => {
    const [result] = await evaluateSingleRule('HIGH_ISSUE_RATE', {
      totalEmployees: 100,
      criticalIssues: 15,
    });

    expect(result.triggered).toBe(true);
    expect(result.tool).toBeNull();
    expect(result.message).toContain('15.0%');
  });

  it('does not trigger when at or below 10% of employees have critical open issues', async () => {
    const [result] = await evaluateSingleRule('HIGH_ISSUE_RATE', {
      totalEmployees: 100,
      criticalIssues: 10,
    });

    expect(result.triggered).toBe(false);
  });

  it('does not trigger (and does not divide by zero) when there are no employees yet', async () => {
    const [result] = await evaluateSingleRule('HIGH_ISSUE_RATE', {
      totalEmployees: 0,
      criticalIssues: 0,
    });

    expect(result.triggered).toBe(false);
  });
});

describe('AlertRuleEngine — API_TIMEOUT (endpoint does not respond within 30s)', () => {
  it('does not trigger when the tool has no api_endpoint configured', async () => {
    const [result] = await evaluateSingleRule('API_TIMEOUT', {
      tools: [{ ...TOOL, api_endpoint: null }],
    });

    expect(result.triggered).toBe(false);
    expect(result.message).toContain('no api_endpoint configured');
  });

  it('does not trigger when the endpoint responds successfully', async () => {
    mockedAxios.get.mockResolvedValue({ data: {}, status: 200 });

    const [result] = await evaluateSingleRule('API_TIMEOUT', {
      tools: [{ ...TOOL, api_endpoint: 'https://api.cornerstone.com/v1/ping' }],
    });

    expect(result.triggered).toBe(false);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://api.cornerstone.com/v1/ping',
      expect.objectContaining({ timeout: 30000 })
    );
  });

  it('triggers when the request aborts with an axios timeout error code', async () => {
    const timeoutError = Object.assign(new Error('timeout of 30000ms exceeded'), { code: 'ECONNABORTED' });
    mockedAxios.get.mockRejectedValue(timeoutError);
    mockedAxios.isAxiosError.mockReturnValue(true);

    const [result] = await evaluateSingleRule('API_TIMEOUT', {
      tools: [{ ...TOOL, api_endpoint: 'https://api.cornerstone.com/v1/ping' }],
    });

    expect(result.triggered).toBe(true);
    expect(result.message).toContain('did not respond within 30s');
  });

  it('does not trigger for a non-timeout failure (e.g. DNS error) that resolves quickly', async () => {
    const dnsError = Object.assign(new Error('getaddrinfo ENOTFOUND'), { code: 'ENOTFOUND' });
    mockedAxios.get.mockRejectedValue(dnsError);
    mockedAxios.isAxiosError.mockReturnValue(true);

    const [result] = await evaluateSingleRule('API_TIMEOUT', {
      tools: [{ ...TOOL, api_endpoint: 'https://api.cornerstone.com/v1/ping' }],
    });

    expect(result.triggered).toBe(false);
    expect(result.message).toContain('reason other than timeout');
  });
});

describe('AlertRuleEngine — evaluate() orchestration', () => {
  it('evaluates every enabled rule for every active tool, plus the global HIGH_ISSUE_RATE rule once', async () => {
    const tools: Tool[] = [
      { id: 'tool-1', name: 'Cornerstone LMS', slug: 'cornerstone-lms', api_endpoint: null },
      { id: 'tool-2', name: 'ADP France', slug: 'adp-france', api_endpoint: null },
    ];
    const allEnabled = (Object.keys(RULE_DEFAULTS) as AlertRuleName[]).map((name) => ({
      name,
      threshold: String(RULE_DEFAULTS[name].threshold),
      severity: RULE_DEFAULTS[name].severity,
      enabled: true,
    }));
    const db = makeMockDb({ ruleRows: allEnabled, tools, qualityScore: 'MISSING', syncLogStatuses: [] });
    (DatabaseManager.getInstance as jest.Mock).mockReturnValue(db);

    const engine = new AlertRuleEngine();
    const results = await engine.evaluate();

    // 4 per-tool rules x 2 tools + 1 global rule = 9
    expect(results).toHaveLength(9);
    expect(results.filter((r) => r.rule === 'HIGH_ISSUE_RATE')).toHaveLength(1);
    expect(results.filter((r) => r.rule === 'QUALITY_DEGRADATION')).toHaveLength(2);
  });

  it('skips a rule entirely (for every tool) when it is disabled in alert_rules', async () => {
    const disabled = (Object.keys(RULE_DEFAULTS) as AlertRuleName[]).map((name) => ({
      name,
      threshold: String(RULE_DEFAULTS[name].threshold),
      severity: RULE_DEFAULTS[name].severity,
      enabled: name !== 'QUALITY_DEGRADATION',
    }));
    const db = makeMockDb({ ruleRows: disabled, tools: [TOOL], qualityScore: 'MISSING', syncLogStatuses: [] });
    (DatabaseManager.getInstance as jest.Mock).mockReturnValue(db);

    const engine = new AlertRuleEngine();
    const results = await engine.evaluate();

    expect(results.some((r) => r.rule === 'QUALITY_DEGRADATION')).toBe(false);
  });

  it('falls back to default thresholds when alert_rules is unavailable, without throwing', async () => {
    const query = jest.fn(async (sql: string) => {
      if (sql.includes('FROM alert_rules')) {
        throw new Error('relation "alert_rules" does not exist');
      }
      if (sql.includes('FROM tools WHERE is_active')) {
        return { rows: [TOOL] };
      }
      return { rows: [] };
    });
    (DatabaseManager.getInstance as jest.Mock).mockReturnValue({
      connect: jest.fn().mockResolvedValue(undefined),
      query,
    });

    const engine = new AlertRuleEngine();

    await expect(engine.evaluate()).resolves.toEqual(expect.any(Array));
  });
});
