import axios from 'axios';
import DatabaseManager from '@/lib/database';

export type AlertRuleName =
  | 'QUALITY_DEGRADATION'
  | 'SYNC_FAILURE_STREAK'
  | 'NO_SYNC_24H'
  | 'HIGH_ISSUE_RATE'
  | 'API_TIMEOUT';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface AlertRuleResult {
  rule: AlertRuleName;
  tool: string | null;
  toolId: string | null;
  triggered: boolean;
  severity: AlertSeverity;
  message: string;
}

interface ToolRow {
  id: string;
  name: string;
  slug: string;
  api_endpoint: string | null;
}

interface RuleConfig {
  threshold: number;
  severity: AlertSeverity;
  enabled: boolean;
}

const DEFAULT_RULE_CONFIG: Record<AlertRuleName, RuleConfig> = {
  QUALITY_DEGRADATION: { threshold: 80, severity: 'warning', enabled: true },
  SYNC_FAILURE_STREAK: { threshold: 3, severity: 'critical', enabled: true },
  NO_SYNC_24H: { threshold: 24, severity: 'critical', enabled: true },
  HIGH_ISSUE_RATE: { threshold: 10, severity: 'critical', enabled: true },
  API_TIMEOUT: { threshold: 30000, severity: 'warning', enabled: true },
};

function isBuiltInRuleName(value: string): value is AlertRuleName {
  return Object.prototype.hasOwnProperty.call(DEFAULT_RULE_CONFIG, value);
}

export class AlertRuleEngine {
  async evaluate(): Promise<AlertRuleResult[]> {
    const db = DatabaseManager.getInstance();
    await db.connect();

    const config = await this.loadRulesConfig(db);

    const toolsResult = await db.query<ToolRow>(
      'SELECT id, name, slug, api_endpoint FROM tools WHERE is_active = true'
    );
    const tools = toolsResult.rows;

    const results: AlertRuleResult[] = [];

    if (config.QUALITY_DEGRADATION.enabled) {
      results.push(
        ...(await Promise.all(
          tools.map((tool) => this.checkQualityDegradation(db, tool, config.QUALITY_DEGRADATION))
        ))
      );
    }

    if (config.SYNC_FAILURE_STREAK.enabled) {
      results.push(
        ...(await Promise.all(
          tools.map((tool) => this.checkSyncFailureStreak(db, tool, config.SYNC_FAILURE_STREAK))
        ))
      );
    }

    if (config.NO_SYNC_24H.enabled) {
      results.push(
        ...(await Promise.all(tools.map((tool) => this.checkNoSync24h(db, tool, config.NO_SYNC_24H))))
      );
    }

    if (config.API_TIMEOUT.enabled) {
      results.push(
        ...(await Promise.all(tools.map((tool) => this.checkApiTimeout(tool, config.API_TIMEOUT))))
      );
    }

    if (config.HIGH_ISSUE_RATE.enabled) {
      results.push(await this.checkHighIssueRate(db, config.HIGH_ISSUE_RATE));
    }

    return results;
  }

  private async loadRulesConfig(db: DatabaseManager): Promise<Record<AlertRuleName, RuleConfig>> {
    const config: Record<AlertRuleName, RuleConfig> = { ...DEFAULT_RULE_CONFIG };

    try {
      const result = await db.query<{
        name: string;
        threshold: string;
        severity: AlertSeverity;
        enabled: boolean;
      }>('SELECT name, threshold, severity, enabled FROM alert_rules WHERE name = ANY($1)', [
        Object.keys(DEFAULT_RULE_CONFIG),
      ]);

      for (const row of result.rows) {
        if (isBuiltInRuleName(row.name)) {
          config[row.name] = {
            threshold: Number(row.threshold),
            severity: row.severity,
            enabled: row.enabled,
          };
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [AlertRuleEngine] Failed to load rule config, using defaults: ${message}`);
    }

    return config;
  }

  private async checkQualityDegradation(
    db: DatabaseManager,
    tool: ToolRow,
    ruleConfig: RuleConfig
  ): Promise<AlertRuleResult> {
    const result = await db.query<{ quality_score: string }>(
      `SELECT quality_score FROM data_quality_metrics WHERE tool_id = $1 AND metric_date = CURRENT_DATE`,
      [tool.id]
    );

    if (result.rows.length === 0) {
      return {
        rule: 'QUALITY_DEGRADATION',
        tool: tool.slug,
        toolId: tool.id,
        triggered: false,
        severity: ruleConfig.severity,
        message: `No quality data for ${tool.name} today.`,
      };
    }

    const qualityScore = Number(result.rows[0].quality_score);
    const triggered = qualityScore < ruleConfig.threshold;

    return {
      rule: 'QUALITY_DEGRADATION',
      tool: tool.slug,
      toolId: tool.id,
      triggered,
      severity: ruleConfig.severity,
      message: triggered
        ? `${tool.name} quality score dropped to ${qualityScore}% (threshold: ${ruleConfig.threshold}%).`
        : `${tool.name} quality score is ${qualityScore}%.`,
    };
  }

  private async checkSyncFailureStreak(
    db: DatabaseManager,
    tool: ToolRow,
    ruleConfig: RuleConfig
  ): Promise<AlertRuleResult> {
    const streakLength = ruleConfig.threshold;
    const result = await db.query<{ status: string }>(
      `SELECT status FROM sync_logs WHERE tool_id = $1 ORDER BY sync_start DESC LIMIT $2`,
      [tool.id, streakLength]
    );

    const triggered =
      result.rows.length === streakLength && result.rows.every((row) => row.status === 'failed');

    return {
      rule: 'SYNC_FAILURE_STREAK',
      tool: tool.slug,
      toolId: tool.id,
      triggered,
      severity: ruleConfig.severity,
      message: triggered
        ? `${tool.name} has failed its last ${streakLength} syncs in a row.`
        : `${tool.name} has no sync failure streak.`,
    };
  }

  private async checkNoSync24h(
    db: DatabaseManager,
    tool: ToolRow,
    ruleConfig: RuleConfig
  ): Promise<AlertRuleResult> {
    const result = await db.query<{ last_sync: string | null }>(
      `SELECT MAX(sync_start) AS last_sync FROM sync_logs WHERE tool_id = $1`,
      [tool.id]
    );

    const lastSync = result.rows[0]?.last_sync ? new Date(result.rows[0].last_sync) : null;
    const hoursSinceSync = lastSync ? (Date.now() - lastSync.getTime()) / (1000 * 60 * 60) : null;
    const triggered = hoursSinceSync === null || hoursSinceSync > ruleConfig.threshold;

    return {
      rule: 'NO_SYNC_24H',
      tool: tool.slug,
      toolId: tool.id,
      triggered,
      severity: ruleConfig.severity,
      message:
        hoursSinceSync === null
          ? `${tool.name} has never synced.`
          : triggered
            ? `${tool.name} has not synced in ${Math.round(hoursSinceSync)} hours (threshold: ${ruleConfig.threshold}h).`
            : `${tool.name} synced ${Math.round(hoursSinceSync)} hours ago.`,
    };
  }

  private async checkApiTimeout(tool: ToolRow, ruleConfig: RuleConfig): Promise<AlertRuleResult> {
    const timeoutMs = ruleConfig.threshold;

    if (!tool.api_endpoint) {
      return {
        rule: 'API_TIMEOUT',
        tool: tool.slug,
        toolId: tool.id,
        triggered: false,
        severity: ruleConfig.severity,
        message: `${tool.name} has no api_endpoint configured.`,
      };
    }

    const startTime = Date.now();

    try {
      await axios.get(tool.api_endpoint, { timeout: timeoutMs });
      return {
        rule: 'API_TIMEOUT',
        tool: tool.slug,
        toolId: tool.id,
        triggered: false,
        severity: ruleConfig.severity,
        message: `${tool.name} endpoint responded within ${timeoutMs / 1000}s.`,
      };
    } catch (error) {
      const elapsedMs = Date.now() - startTime;
      const isTimeout =
        (axios.isAxiosError(error) && error.code === 'ECONNABORTED') || elapsedMs >= timeoutMs;

      return {
        rule: 'API_TIMEOUT',
        tool: tool.slug,
        toolId: tool.id,
        triggered: isTimeout,
        severity: ruleConfig.severity,
        message: isTimeout
          ? `${tool.name} endpoint did not respond within ${timeoutMs / 1000}s.`
          : `${tool.name} endpoint check failed for a reason other than timeout.`,
      };
    }
  }

  private async checkHighIssueRate(db: DatabaseManager, ruleConfig: RuleConfig): Promise<AlertRuleResult> {
    const totalResult = await db.query<{ total: string }>('SELECT COUNT(*) AS total FROM employees');
    const totalEmployees = Number(totalResult.rows[0]?.total ?? 0);

    const criticalResult = await db.query<{ count: string }>(
      `SELECT COUNT(DISTINCT employee_id) AS count
       FROM employee_issues
       WHERE status = 'open' AND severity = 'critical'`
    );
    const employeesWithCriticalIssues = Number(criticalResult.rows[0]?.count ?? 0);

    const rate = totalEmployees > 0 ? (employeesWithCriticalIssues / totalEmployees) * 100 : 0;
    const triggered = totalEmployees > 0 && rate > ruleConfig.threshold;

    return {
      rule: 'HIGH_ISSUE_RATE',
      tool: null,
      toolId: null,
      triggered,
      severity: ruleConfig.severity,
      message: triggered
        ? `${rate.toFixed(1)}% of employees have critical open issues (threshold: ${ruleConfig.threshold}%).`
        : `${rate.toFixed(1)}% of employees have critical open issues.`,
    };
  }
}
