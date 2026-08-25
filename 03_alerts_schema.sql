-- ====================================================================
-- 🚨 LESAFFRE HR BACKEND - ALERTS SCHEMA
-- ====================================================================
-- Replaces the `alerts` table from 01_lesaffre_schema.sql (alert_type ->
-- rule, integer id -> UUID) to match the alert-rule-engine contract.
-- Safe to drop/recreate: the table is empty in every environment this
-- has been applied to, and nothing else references alerts(id).

DROP TABLE IF EXISTS alerts;

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule VARCHAR(50) NOT NULL,
  tool_id UUID REFERENCES tools(id),
  employee_id UUID REFERENCES employees(id),
  severity VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW(),
  acknowledged_at TIMESTAMP,
  acknowledged_by VARCHAR(100)
);

CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_rule ON alerts(rule);
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);

-- ====================================================================

CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  condition_type VARCHAR(100) NOT NULL,
  threshold NUMERIC NOT NULL,
  severity VARCHAR(20) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alert_rules_enabled ON alert_rules(enabled);

INSERT INTO alert_rules (name, condition_type, threshold, severity, enabled)
VALUES
  ('QUALITY_DEGRADATION', 'quality_score_below_percent', 80, 'warning', true),
  ('SYNC_FAILURE_STREAK', 'consecutive_failed_syncs', 3, 'critical', true),
  ('NO_SYNC_24H', 'hours_since_last_sync_above', 24, 'critical', true),
  ('HIGH_ISSUE_RATE', 'critical_issue_rate_above_percent', 10, 'critical', true),
  ('API_TIMEOUT', 'response_time_above_ms', 30000, 'warning', true)
ON CONFLICT (name) DO NOTHING;
