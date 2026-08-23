-- ====================================================================
-- 🗄️ LESAFFRE HR BACKEND - POSTGRESQL SCHEMA
-- ====================================================================

CREATE TABLE IF NOT EXISTS tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  country VARCHAR(50),
  official_url VARCHAR(255),
  api_endpoint VARCHAR(255),
  integration_type VARCHAR(50),
  auth_method VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP,
  sync_status VARCHAR(20),
  estimated_record_count INT,
  data_owner VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tools_active ON tools(is_active);
CREATE INDEX idx_tools_category ON tools(category);

-- ====================================================================

CREATE TABLE IF NOT EXISTS tool_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  api_key_encrypted TEXT,
  secret_encrypted TEXT,
  username_encrypted TEXT,
  password_encrypted TEXT,
  oauth_token_encrypted TEXT,
  oauth_refresh_token_encrypted TEXT,
  webhook_secret VARCHAR(255),
  webhook_url VARCHAR(255),
  custom_headers JSONB,
  custom_params JSONB,
  is_active BOOLEAN DEFAULT true,
  last_tested TIMESTAMP,
  last_test_status VARCHAR(20),
  last_error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tool_id)
);

CREATE INDEX idx_tool_integrations_tool ON tool_integrations(tool_id);
CREATE INDEX idx_tool_integrations_active ON tool_integrations(is_active);

-- ====================================================================

CREATE TABLE IF NOT EXISTS sync_logs (
  id SERIAL PRIMARY KEY,
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  sync_type VARCHAR(50),
  sync_start TIMESTAMP NOT NULL DEFAULT NOW(),
  sync_end TIMESTAMP,
  records_synced INT DEFAULT 0,
  records_failed INT DEFAULT 0,
  records_skipped INT DEFAULT 0,
  status VARCHAR(20) NOT NULL,
  error_message TEXT,
  error_stack TEXT,
  error_code VARCHAR(50),
  triggered_by VARCHAR(50),
  request_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sync_logs_status ON sync_logs(status);
CREATE INDEX idx_sync_logs_tool_date ON sync_logs(tool_id, created_at DESC);

-- ====================================================================

CREATE TABLE IF NOT EXISTS data_quality_metrics (
  id SERIAL PRIMARY KEY,
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_records INT NOT NULL DEFAULT 0,
  valid_records INT NOT NULL DEFAULT 0,
  invalid_records INT NOT NULL DEFAULT 0,
  duplicate_records INT DEFAULT 0,
  missing_required INT DEFAULT 0,
  quality_score NUMERIC(5, 2) NOT NULL,
  top_issues TEXT[],
  calculated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tool_id, metric_date)
);

CREATE INDEX idx_quality_metrics_date ON data_quality_metrics(metric_date DESC);
CREATE INDEX idx_quality_metrics_tool ON data_quality_metrics(tool_id);

-- ====================================================================

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  hire_date DATE,
  department VARCHAR(100),
  job_title VARCHAR(100),
  manager_id UUID REFERENCES employees(id),
  cornerstone_id VARCHAR(100),
  adp_id VARCHAR(100),
  kelio_id VARCHAR(100),
  data_quality_score INT DEFAULT 0,
  last_validated TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  synced_from TEXT[]
);

CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_quality ON employees(data_quality_score);

-- ====================================================================

CREATE TABLE IF NOT EXISTS employee_issues (
  id SERIAL PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  issue_type VARCHAR(50),
  severity VARCHAR(20),
  description TEXT,
  status VARCHAR(20) DEFAULT 'open',
  resolved_by VARCHAR(100),
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  detected_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_employee_issues_status ON employee_issues(status);
CREATE INDEX idx_employee_issues_type ON employee_issues(issue_type);
CREATE INDEX idx_employee_issues_severity ON employee_issues(severity);

-- ====================================================================

CREATE TABLE IF NOT EXISTS audit_trail (
  id SERIAL PRIMARY KEY,
  resource_type VARCHAR(50),
  resource_id UUID,
  action VARCHAR(50),
  old_values JSONB,
  new_values JSONB,
  changed_by VARCHAR(100),
  change_reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_resource ON audit_trail(resource_type, resource_id);
CREATE INDEX idx_audit_user ON audit_trail(changed_by);
CREATE INDEX idx_audit_action ON audit_trail(action);
CREATE INDEX idx_audit_date ON audit_trail(created_at DESC);

-- ====================================================================

CREATE TABLE IF NOT EXISTS sync_schedules (
  id SERIAL PRIMARY KEY,
  tool_id UUID NOT NULL UNIQUE REFERENCES tools(id) ON DELETE CASCADE,
  cron_expression VARCHAR(100),
  sync_time TIME,
  frequency VARCHAR(50),
  enable_webhook BOOLEAN DEFAULT false,
  webhook_events TEXT[],
  is_active BOOLEAN DEFAULT true,
  last_run TIMESTAMP,
  next_run TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_schedules_active ON sync_schedules(is_active);

-- ====================================================================

CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  alert_type VARCHAR(50),
  severity VARCHAR(20),
  tool_id UUID REFERENCES tools(id),
  employee_id UUID REFERENCES employees(id),
  message TEXT NOT NULL,
  details JSONB,
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW(),
  acknowledged_at TIMESTAMP,
  acknowledged_by VARCHAR(100)
);

CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_type ON alerts(alert_type);

-- ====================================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  description TEXT,
  owner_email VARCHAR(100) NOT NULL,
  permissions TEXT[],
  last_used TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX idx_api_keys_active ON api_keys(is_active);

-- ====================================================================
-- INSERT INITIAL DATA
-- ====================================================================

INSERT INTO tools (name, slug, description, category, country, official_url, api_endpoint, integration_type, auth_method, is_active, data_owner)
VALUES
  (
    'Cornerstone LMS',
    'cornerstone-lms',
    'Global learning management system for training and compliance',
    'Learning',
    'Global',
    'https://www.cornerstone.com',
    'https://api.cornerstone.com/v1',
    'API',
    'OAuth',
    true,
    'Bilal Boussetta'
  ),
  (
    'ADP France',
    'adp-france',
    'Payroll processing and legal compliance for France',
    'Payroll',
    'France',
    'https://www.adp.fr',
    'https://api.adp.fr/v1',
    'API',
    'API_Key',
    true,
    'Cyrine'
  ),
  (
    'Kelio',
    'kelio',
    'Time tracking and scheduling for French sites',
    'Time & Attendance',
    'France',
    'https://www.kelio.com',
    'https://api.kelio.com/v1',
    'API',
    'API_Key',
    true,
    'Valérie'
  ),
  (
    'BioLearn Campus',
    'biolearn-campus',
    'Regional LMS for biotech manufacturing safety and compliance training',
    'Learning',
    'Germany',
    'https://www.biolearn-campus.de',
    'https://api.biolearn-campus.de/v1',
    'API',
    'OAuth',
    true,
    'Sirine Daramdane'
  ),
  (
    'SkillForge Poland',
    'skillforge-poland',
    'Technical and language upskilling platform for Polish R&D and plant teams',
    'Learning',
    'Poland',
    'https://www.skillforge.pl',
    'https://api.skillforge.pl/v1',
    'API',
    'API_Key',
    true,
    'Raphaële'
  )
ON CONFLICT DO NOTHING;

-- ====================================================================

CREATE OR REPLACE VIEW v_recent_syncs AS
SELECT
  t.name as tool_name,
  sl.sync_start,
  sl.status,
  sl.records_synced,
  sl.records_failed,
  EXTRACT(EPOCH FROM (sl.sync_end - sl.sync_start)) as sync_duration_seconds
FROM sync_logs sl
JOIN tools t ON sl.tool_id = t.id
ORDER BY sl.sync_start DESC
LIMIT 20;

-- ====================================================================

CREATE OR REPLACE VIEW v_tool_health AS
SELECT
  t.name,
  t.sync_status,
  t.last_sync,
  COALESCE(dqm.quality_score, 0) as data_quality_score,
  COALESCE(dqm.total_records, 0) as record_count,
  (
    SELECT COUNT(*)
    FROM sync_logs
    WHERE tool_id = t.id
      AND created_at > NOW() - INTERVAL '7 days'
      AND status = 'success'
  ) as successful_syncs_7d
FROM tools t
LEFT JOIN data_quality_metrics dqm ON t.id = dqm.tool_id
  AND dqm.metric_date = CURRENT_DATE;

-- ====================================================================

CREATE OR REPLACE VIEW v_data_quality_status AS
SELECT
  dqm.tool_id,
  t.name as tool_name,
  dqm.total_records,
  dqm.valid_records,
  dqm.invalid_records,
  dqm.quality_score,
  dqm.top_issues,
  dqm.metric_date
FROM data_quality_metrics dqm
JOIN tools t ON dqm.tool_id = t.id
WHERE dqm.metric_date = CURRENT_DATE;

-- ====================================================================
-- ✅ SCHEMA COMPLETE
-- ====================================================================