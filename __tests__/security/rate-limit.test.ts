/**
 * Unit tests for middleware/rate-limit.ts.
 */

import {
  checkRateLimit,
  getClientIp,
  isRateLimitingEnabled,
  RATE_LIMITS,
  type RateLimitStore,
} from '@/middleware/rate-limit';

describe('checkRateLimit()', () => {
  it('allows requests up to the limit, then returns allowed: false (→ 429 at the call site)', async () => {
    const key = `test-${Date.now()}`;
    const options = { limit: 3, windowMs: 60_000 };

    const first = await checkRateLimit(key, options);
    const second = await checkRateLimit(key, options);
    const third = await checkRateLimit(key, options);
    const fourth = await checkRateLimit(key, options);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(true);
    expect(fourth.allowed).toBe(false);
    expect(fourth.remaining).toBe(0);
  });

  it('tracks separate buckets per key (one client hitting the limit does not affect another)', async () => {
    const options = { limit: 1, windowMs: 60_000 };
    const keyA = `test-a-${Date.now()}`;
    const keyB = `test-b-${Date.now()}`;

    await checkRateLimit(keyA, options);
    const aSecond = await checkRateLimit(keyA, options);
    const bFirst = await checkRateLimit(keyB, options);

    expect(aSecond.allowed).toBe(false);
    expect(bFirst.allowed).toBe(true);
  });

  it('resets the count once the window has elapsed', async () => {
    const key = `test-reset-${Date.now()}`;
    const options = { limit: 1, windowMs: 10 };

    const first = await checkRateLimit(key, options);
    await new Promise((resolve) => setTimeout(resolve, 20));
    const second = await checkRateLimit(key, options);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
  });

  it('uses a custom store when provided, instead of the default in-memory one', async () => {
    const bucket = { count: 0, resetAt: Date.now() + 60_000 };
    const customStore: RateLimitStore = {
      increment: jest.fn(async () => {
        bucket.count += 1;
        return bucket;
      }),
    };

    await checkRateLimit('any-key', { limit: 5, windowMs: 60_000, store: customStore });

    expect(customStore.increment).toHaveBeenCalledTimes(1);
    expect(bucket.count).toBe(1);
  });

  it('logs a warning when the limit is exceeded', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const key = `test-warn-${Date.now()}`;
    const options = { limit: 1, windowMs: 60_000 };

    await checkRateLimit(key, options);
    await checkRateLimit(key, options);

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Limit exceeded'));
    warnSpy.mockRestore();
  });
});

describe('RATE_LIMITS policy', () => {
  it('matches docs/SECURITY.md: 100/min public, 1000/min authenticated, 500/min per API key', () => {
    expect(RATE_LIMITS.PUBLIC_PER_IP).toEqual({ limit: 100, windowMs: 60_000 });
    expect(RATE_LIMITS.AUTHENTICATED_PER_IP).toEqual({ limit: 1000, windowMs: 60_000 });
    expect(RATE_LIMITS.PER_API_KEY).toEqual({ limit: 500, windowMs: 60_000 });
  });
});

describe('isRateLimitingEnabled()', () => {
  const originalValue = process.env.RATE_LIMIT_ENABLED;

  afterEach(() => {
    if (originalValue === undefined) delete process.env.RATE_LIMIT_ENABLED;
    else process.env.RATE_LIMIT_ENABLED = originalValue;
  });

  it('defaults to true when unset', () => {
    delete process.env.RATE_LIMIT_ENABLED;
    expect(isRateLimitingEnabled()).toBe(true);
  });

  it('is false only when explicitly set to "false"', () => {
    process.env.RATE_LIMIT_ENABLED = 'false';
    expect(isRateLimitingEnabled()).toBe(false);

    process.env.RATE_LIMIT_ENABLED = 'true';
    expect(isRateLimitingEnabled()).toBe(true);
  });
});

describe('getClientIp()', () => {
  it('reads the first address from x-forwarded-for', () => {
    const request = new Request('http://localhost/api/health', {
      headers: { 'x-forwarded-for': '203.0.113.5, 70.41.3.18, 150.172.238.178' },
    });
    expect(getClientIp(request)).toBe('203.0.113.5');
  });

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const request = new Request('http://localhost/api/health', {
      headers: { 'x-real-ip': '203.0.113.9' },
    });
    expect(getClientIp(request)).toBe('203.0.113.9');
  });

  it('returns "unknown" when neither header is present', () => {
    const request = new Request('http://localhost/api/health');
    expect(getClientIp(request)).toBe('unknown');
  });
});
