/**
 * Integration tests for the webhooks routes + real delivery, against the
 * real PostgreSQL instance. A tiny local HTTP server (127.0.0.1, ephemeral
 * port — passes isValidWebhookUrl's localhost allowance) stands in for a
 * real subscriber so delivery is exercised for real, without depending on
 * any external service. All rows created are deleted in afterAll.
 */

import type { AddressInfo } from 'node:net';
import http from 'node:http';
import { POST as postSubscribe } from '@/app/api/webhooks/subscribe/route';
import { POST as postTest } from '@/app/api/webhooks/test/route';
import { webhookManager } from '@/lib/webhooks';
import DatabaseManager from '@/lib/database';
import { buildRequest, readJson } from './helpers';

let server: http.Server;
let baseUrl: string;
let received: { path: string; body: { event?: string; data?: unknown } }[] = [];
const createdSubscriptionIds: string[] = [];

beforeAll(async () => {
  server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      received.push({ path: req.url ?? '', body: raw ? JSON.parse(raw) : {} });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: true }));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await DatabaseManager.getInstance().close();
});

beforeEach(() => {
  received = [];
});

// Each subscription is deleted right after its own test, rather than
// batched in afterAll — otherwise subscriptions from earlier tests in
// this file would still be active (and receive) later delivery tests.
afterEach(async () => {
  if (createdSubscriptionIds.length === 0) return;
  const db = DatabaseManager.getInstance();
  await db.connect();
  await db.query('DELETE FROM webhooks_subscriptions WHERE id = ANY($1)', [createdSubscriptionIds]);
  createdSubscriptionIds.length = 0;
});

describe('POST /api/webhooks/subscribe (integration)', () => {
  it('creates a subscription row for a valid localhost url', async () => {
    const response = await postSubscribe(
      buildRequest('/api/webhooks/subscribe', {
        method: 'POST',
        body: { url: `${baseUrl}/hook`, events: ['sync.completed', 'alert.triggered'], name: 'Jest test sub' },
      })
    );
    const body = await readJson<{ success: boolean; subscriptionId: string; webhook_url: string }>(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.webhook_url).toBe(`${baseUrl}/hook`);
    createdSubscriptionIds.push(body.subscriptionId);

    const db = DatabaseManager.getInstance();
    await db.connect();
    const { rows } = await db.query('SELECT id, url, events FROM webhooks_subscriptions WHERE id = $1', [
      body.subscriptionId,
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].events).toEqual(['sync.completed', 'alert.triggered']);
  });

  it('rejects a non-HTTPS, non-localhost url with 400', async () => {
    const response = await postSubscribe(
      buildRequest('/api/webhooks/subscribe', {
        method: 'POST',
        body: { url: 'http://evil.example.com/hook', events: ['sync.completed'] },
      })
    );

    expect(response.status).toBe(400);
  });

  it('rejects an unknown event name with 400', async () => {
    const response = await postSubscribe(
      buildRequest('/api/webhooks/subscribe', {
        method: 'POST',
        body: { url: `${baseUrl}/hook`, events: ['tool.deleted'] },
      })
    );

    expect(response.status).toBe(400);
  });
});

describe('POST /api/webhooks/test (integration)', () => {
  it('delivers a real webhook.test event to the subscription URL and reports success/timing', async () => {
    const subscribeResponse = await postSubscribe(
      buildRequest('/api/webhooks/subscribe', {
        method: 'POST',
        body: { url: `${baseUrl}/hook`, events: ['sync.completed'] },
      })
    );
    const { subscriptionId } = await readJson<{ subscriptionId: string }>(subscribeResponse);
    createdSubscriptionIds.push(subscriptionId);

    const response = await postTest(
      buildRequest('/api/webhooks/test', { method: 'POST', body: { subscriptionId } })
    );
    const body = await readJson<{ success: boolean; statusCode: number; responseTime: number }>(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.statusCode).toBe(200);
    expect(body.responseTime).toBeGreaterThanOrEqual(0);

    expect(received).toHaveLength(1);
    expect(received[0].body.event).toBe('webhook.test');
  });

  it('returns 404 for an unknown subscriptionId', async () => {
    const response = await postTest(
      buildRequest('/api/webhooks/test', {
        method: 'POST',
        body: { subscriptionId: '00000000-0000-0000-0000-000000000000' },
      })
    );

    expect(response.status).toBe(404);
  });
});

describe('webhookManager.trigger delivery on sync.completed (integration)', () => {
  it('delivers the real payload envelope to every active subscriber for that event', async () => {
    const subscribeResponse = await postSubscribe(
      buildRequest('/api/webhooks/subscribe', {
        method: 'POST',
        body: { url: `${baseUrl}/hook`, events: ['sync.completed'] },
      })
    );
    const { subscriptionId } = await readJson<{ subscriptionId: string }>(subscribeResponse);
    createdSubscriptionIds.push(subscriptionId);

    await webhookManager.trigger('sync.completed', {
      tool: 'cornerstone',
      recordsSynced: 5,
      recordsFailed: 0,
      status: 'success',
      syncId: 999,
    });

    expect(received).toHaveLength(1);
    expect(received[0].body).toMatchObject({
      event: 'sync.completed',
      data: { tool: 'cornerstone', recordsSynced: 5, status: 'success' },
    });
  });
});
