-- ====================================================================
-- 🔒 LESAFFRE HR BACKEND - SECURITY SCHEMA
-- ====================================================================
-- `api_keys` and `audit_trail` already exist (01_lesaffre_schema.sql).
-- This adds the single-row config table backing GET/PATCH /api/admin/settings.

CREATE TABLE IF NOT EXISTS security_settings (
  id INT PRIMARY KEY DEFAULT 1,
  rate_limit_enabled BOOLEAN NOT NULL DEFAULT true,
  rate_limit_public_per_minute INT NOT NULL DEFAULT 100,
  rate_limit_authenticated_per_minute INT NOT NULL DEFAULT 1000,
  rate_limit_per_api_key_per_minute INT NOT NULL DEFAULT 500,
  cors_allowed_origins TEXT[] NOT NULL DEFAULT ARRAY[
    'http://localhost:3000', 'http://localhost:3001', 'https://lesaffre.com'
  ],
  security_headers_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by VARCHAR(100),
  CONSTRAINT security_settings_singleton CHECK (id = 1)
);

INSERT INTO security_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
