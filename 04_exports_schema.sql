-- ====================================================================
-- 📤 LESAFFRE HR BACKEND - EXPORTS SCHEMA
-- ====================================================================

CREATE TABLE IF NOT EXISTS scheduled_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL,
  format VARCHAR(10) NOT NULL,
  frequency VARCHAR(20) NOT NULL,
  recipients TEXT[] NOT NULL DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  last_run TIMESTAMP,
  next_run TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scheduled_exports_enabled ON scheduled_exports(enabled);
CREATE INDEX idx_scheduled_exports_next_run ON scheduled_exports(next_run);
