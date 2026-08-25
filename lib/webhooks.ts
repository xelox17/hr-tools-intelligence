import { AxiosInstance } from 'axios';
import DatabaseManager from '@/lib/database';
import { createHttpClient, requestWithRetry } from '@/lib/connectors/http';

export const ALLOWED_WEBHOOK_EVENTS = [
  'sync.completed',
  'sync.failed',
  'data.quality.alert',
  'alert.triggered',
] as const;

export type WebhookEvent = (typeof ALLOWED_WEBHOOK_EVENTS)[number];

export function isKnownWebhookEvent(value: string): value is WebhookEvent {
  return (ALLOWED_WEBHOOK_EVENTS as readonly string[]).includes(value);
}

export function isValidWebhookUrl(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  if (parsed.protocol === 'https:') return true;
  return (
    parsed.protocol === 'http:' &&
    (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
  );
}

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}

interface WebhookSubscriptionRow {
  id: string;
  url: string;
}

export class WebhookManager {
  private client: AxiosInstance;

  constructor() {
    this.client = createHttpClient('', { 'Content-Type': 'application/json' });
  }

  async trigger(event: WebhookEvent, data: Record<string, unknown>): Promise<void> {
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const db = DatabaseManager.getInstance();
    await db.connect();

    const subscribers = await this.getActiveSubscribers(db, event);

    let notified = 0;
    let failed = 0;

    await Promise.all(
      subscribers.map(async (subscriber) => {
        try {
          await this.deliver(subscriber.url, payload);
          notified++;
          console.log(`✅ [WebhookManager] Delivered "${event}" to ${subscriber.url}`);
        } catch (error) {
          failed++;
          const message = error instanceof Error ? error.message : 'Unknown error';
          console.error(
            `❌ [WebhookManager] Failed to deliver "${event}" to ${subscriber.url}: ${message}`
          );
        }
      })
    );

    await this.logEvent(db, event, payload, notified, failed);
  }

  private async getActiveSubscribers(
    db: DatabaseManager,
    event: WebhookEvent
  ): Promise<WebhookSubscriptionRow[]> {
    const result = await db.query<WebhookSubscriptionRow>(
      `SELECT id, url FROM webhooks_subscriptions WHERE is_active = true AND $1 = ANY(events)`,
      [event]
    );
    return result.rows;
  }

  private async deliver(url: string, payload: WebhookPayload): Promise<void> {
    await requestWithRetry(this.client, { method: 'POST', url, data: payload }, 'WebhookManager');
  }

  private async logEvent(
    db: DatabaseManager,
    event: WebhookEvent,
    payload: WebhookPayload,
    notified: number,
    failed: number
  ): Promise<void> {
    try {
      await db.query(
        `INSERT INTO webhook_events (event_type, payload, subscribers_notified, subscribers_failed)
         VALUES ($1, $2, $3, $4)`,
        [event, JSON.stringify(payload), notified, failed]
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.log(
        `ℹ️ [WebhookManager] webhook_events table unavailable (${message}), logging event to console instead`
      );
      console.log(`[WebhookManager] Event "${event}":`, JSON.stringify(payload));
    }
  }
}

export const webhookManager = new WebhookManager();
