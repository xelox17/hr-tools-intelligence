/**
 * Rate limiting (OWASP A04 — insecure design / resource exhaustion).
 *
 * In-memory Map store — works for a single Next.js instance (fine for dev
 * and a single-node deployment). It does NOT share state across multiple
 * instances/regions; swap in a Redis-backed RateLimitStore (e.g. via
 * `@upstash/ratelimit` or `ioredis`, using the same `increment` contract)
 * before running more than one instance in production. No Redis client is
 * wired up here since none is provisioned in this project yet.
 */

export interface RateLimitBucket {
  count: number;
  resetAt: number;
}

export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<RateLimitBucket>;
}

class MemoryRateLimitStore implements RateLimitStore {
  private buckets = new Map<string, RateLimitBucket>();

  async increment(key: string, windowMs: number): Promise<RateLimitBucket> {
    const now = Date.now();
    const existing = this.buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      const bucket: RateLimitBucket = { count: 1, resetAt: now + windowMs };
      this.buckets.set(key, bucket);
      return bucket;
    }

    existing.count += 1;
    return existing;
  }

  /** Test/dev helper — not part of the RateLimitStore contract. */
  reset(): void {
    this.buckets.clear();
  }
}

export const memoryRateLimitStore = new MemoryRateLimitStore();

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  store?: RateLimitStore;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export async function checkRateLimit(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
  const store = options.store ?? memoryRateLimitStore;
  const bucket = await store.increment(key, options.windowMs);
  const allowed = bucket.count <= options.limit;

  if (!allowed) {
    console.warn(
      `⚠️ [rate-limit] Limit exceeded for "${key}": ${bucket.count}/${options.limit} in the current window`
    );
  }

  return {
    allowed,
    limit: options.limit,
    remaining: Math.max(0, options.limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}

/** Per docs/SECURITY.md's rate-limit policy. All are requests/minute. */
export const RATE_LIMITS = {
  PUBLIC_PER_IP: { limit: 100, windowMs: 60_000 },
  AUTHENTICATED_PER_IP: { limit: 1000, windowMs: 60_000 },
  PER_API_KEY: { limit: 500, windowMs: 60_000 },
} as const;

export function isRateLimitingEnabled(): boolean {
  return process.env.RATE_LIMIT_ENABLED !== 'false';
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  return 'unknown';
}
