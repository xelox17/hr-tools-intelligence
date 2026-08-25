/**
 * Unit tests for WebhookManager (lib/webhooks.ts).
 *
 * axios is mocked so no real HTTP request is ever made — WebhookManager
 * builds its own axios instance via `axios.create()`, so we mock that
 * factory to return a controllable `{ request: jest.fn() }` instance.
 * DatabaseManager is mocked so no real Postgres connection is required.
 */

import axios from 'axios';
import DatabaseManager from '@/lib/database';
import {
  WebhookManager,
  isValidWebhookUrl,
  isKnownWebhookEvent,
  ALLOWED_WEBHOOK_EVENTS,
} from '@/lib/webhooks';

jest.mock('axios', () => ({
  __esModule: true,
  default: { create: jest.fn() },
}));

jest.mock('@/lib/database');

describe('WebhookManager', () => {
  let mockRequest: jest.Mock;
  let mockDb: { connect: jest.Mock; query: jest.Mock };
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = jest.fn();
    (axios.create as jest.Mock).mockReturnValue({ request: mockRequest });

    mockDb = {
      connect: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue({ rows: [] }),
    };
    (DatabaseManager.getInstance as jest.Mock).mockReturnValue(mockDb);

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    jest.useRealTimers();
  });

  describe('trigger()', () => {
    it('queries subscribers filtered by the triggering event', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      const manager = new WebhookManager();

      await manager.trigger('sync.completed', { tool: 'cornerstone' });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('$1 = ANY(events)'),
        ['sync.completed']
      );
    });

    it('delivers to every active subscriber returned for the event, with the correct payload envelope', async () => {
      mockDb.query
        .mockResolvedValueOnce({
          rows: [
            { id: 'sub-1', url: 'https://ops.example.com/hook' },
            { id: 'sub-2', url: 'https://relay.example.com/hook' },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }); // logEvent insert
      mockRequest.mockResolvedValue({ data: {}, status: 200 });

      const manager = new WebhookManager();
      await manager.trigger('sync.completed', { tool: 'cornerstone', recordsSynced: 12 });

      expect(mockRequest).toHaveBeenCalledTimes(2);
      const calledUrls = mockRequest.mock.calls.map(([config]) => config.url);
      expect(calledUrls).toEqual(
        expect.arrayContaining(['https://ops.example.com/hook', 'https://relay.example.com/hook'])
      );

      const [firstConfig] = mockRequest.mock.calls[0];
      expect(firstConfig.method).toBe('POST');
      expect(firstConfig.data).toMatchObject({
        event: 'sync.completed',
        data: { tool: 'cornerstone', recordsSynced: 12 },
      });
      expect(typeof firstConfig.data.timestamp).toBe('string');
    });

    it('does not call any subscriber when none are subscribed to the event', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] });

      const manager = new WebhookManager();
      await manager.trigger('alert.triggered', { alertId: 'abc' });

      expect(mockRequest).not.toHaveBeenCalled();
    });

    it('retries a failing delivery up to 3 times with exponential backoff, then logs the failure', async () => {
      jest.useFakeTimers();
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 'sub-1', url: 'https://flaky.example.com/hook' }] })
        .mockResolvedValueOnce({ rows: [] }); // logEvent insert
      mockRequest.mockRejectedValue(new Error('ECONNREFUSED'));

      const manager = new WebhookManager();
      const triggerPromise = manager.trigger('sync.failed', { tool: 'adp', error: 'boom' });

      await jest.runAllTimersAsync();
      await triggerPromise;

      expect(mockRequest).toHaveBeenCalledTimes(3);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to deliver "sync.failed" to https://flaky.example.com/hook'),
      );
    });

    it('logs subscribers_notified / subscribers_failed counts to webhook_events', async () => {
      mockDb.query
        .mockResolvedValueOnce({
          rows: [
            { id: 'sub-1', url: 'https://ok.example.com/hook' },
            { id: 'sub-2', url: 'https://down.example.com/hook' },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }); // logEvent insert
      mockRequest.mockImplementation(({ url }: { url: string }) =>
        url.includes('down') ? Promise.reject(new Error('timeout')) : Promise.resolve({ data: {}, status: 200 })
      );

      const manager = new WebhookManager();
      await manager.trigger('sync.completed', { tool: 'kelio' });

      expect(mockDb.query).toHaveBeenLastCalledWith(
        expect.stringContaining('INSERT INTO webhook_events'),
        expect.arrayContaining(['sync.completed', expect.any(String), 1, 1])
      );
    });

    it('falls back to console logging when the webhook_events table is unavailable, without throwing', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [] }) // subscriber lookup
        .mockRejectedValueOnce(new Error('relation "webhook_events" does not exist')); // logEvent insert fails

      const manager = new WebhookManager();

      await expect(manager.trigger('sync.completed', { tool: 'cornerstone' })).resolves.toBeUndefined();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('webhook_events table unavailable')
      );
    });
  });
});

describe('isValidWebhookUrl', () => {
  it.each([
    ['https://example.com/hook', true],
    ['https://example.com/hook?x=1', true],
    ['http://localhost:4000/hook', true],
    ['http://127.0.0.1:4000/hook', true],
    ['http://example.com/hook', false],
    ['ftp://example.com/hook', false],
    ['not-a-url', false],
    ['', false],
  ])('isValidWebhookUrl(%s) => %s', (url, expected) => {
    expect(isValidWebhookUrl(url)).toBe(expected);
  });
});

describe('isKnownWebhookEvent', () => {
  it('accepts every event in ALLOWED_WEBHOOK_EVENTS', () => {
    for (const event of ALLOWED_WEBHOOK_EVENTS) {
      expect(isKnownWebhookEvent(event)).toBe(true);
    }
  });

  it('rejects an unknown event name', () => {
    expect(isKnownWebhookEvent('tool.deleted')).toBe(false);
  });
});
