-- ====================================================================
-- 🔔 LESAFFRE HR BACKEND - WEBHOOKS SCHEMA
-- ====================================================================

CREATE TABLE IF NOT EXISTS webhooks_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100),
  url VARCHAR(500) NOT NULL,
  events TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhooks_subscriptions_active ON webhooks_subscriptions(is_active);

-- ====================================================================

CREATE TABLE IF NOT EXISTS webhook_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  subscribers_notified INT DEFAULT 0,
  subscribers_failed INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_created ON webhook_events(created_at DESC);
