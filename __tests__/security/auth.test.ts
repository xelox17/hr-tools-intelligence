/**
 * Unit tests for middleware/auth.ts.
 *
 * lib/api-keys.ts is mocked for the authenticateApiKey tests (no real DB
 * needed) — JWT tests exercise the real jose sign/verify round-trip.
 */

import { apiKeyManager } from '@/lib/api-keys';
import {
  extractApiKey,
  extractBearerToken,
  isAdminIdentity,
  signJwt,
  verifyJwt,
  authenticateApiKey,
  type JwtIdentity,
} from '@/middleware/auth';

jest.mock('@/lib/api-keys');

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  jest.clearAllMocks();
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe('extractBearerToken()', () => {
  it('extracts the token from a well-formed Authorization header', () => {
    const request = new Request('http://localhost/api/keys', {
      headers: { authorization: 'Bearer abc.def.ghi' },
    });
    expect(extractBearerToken(request)).toBe('abc.def.ghi');
  });

  it('returns null when the header is missing', () => {
    const request = new Request('http://localhost/api/keys');
    expect(extractBearerToken(request)).toBeNull();
  });

  it('returns null for a non-Bearer scheme', () => {
    const request = new Request('http://localhost/api/keys', {
      headers: { authorization: 'Basic dXNlcjpwYXNz' },
    });
    expect(extractBearerToken(request)).toBeNull();
  });
});

describe('extractApiKey()', () => {
  it('reads the x-api-key header', () => {
    const request = new Request('http://localhost/api/keys', { headers: { 'x-api-key': 'lhr_abc' } });
    expect(extractApiKey(request)).toBe('lhr_abc');
  });

  it('returns null when absent', () => {
    expect(extractApiKey(new Request('http://localhost/api/keys'))).toBeNull();
  });
});

describe('signJwt() / verifyJwt() round-trip', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'a-fixed-32-character-test-secret!!';
  });

  it('verifies a token it just signed and returns the same identity', async () => {
    const identity: JwtIdentity = { userId: 'user-42', role: 'user', email: 'anas@lesaffre.com' };
    const token = await signJwt(identity);

    const verified = await verifyJwt(token);

    expect(verified).toEqual(identity);
  });

  it('returns null for an expired token', async () => {
    const token = await signJwt({ userId: 'user-42', role: 'user' }, '-1s');

    await expect(verifyJwt(token)).resolves.toBeNull();
  });

  it('returns null for a token signed with a different secret', async () => {
    const token = await signJwt({ userId: 'user-42', role: 'user' });

    process.env.JWT_SECRET = 'a-completely-different-32-char-secret';
    await expect(verifyJwt(token)).resolves.toBeNull();
  });

  it('returns null for a malformed token', async () => {
    await expect(verifyJwt('not-a-jwt')).resolves.toBeNull();
  });

  it('returns null when the sub or role claim is missing', async () => {
    // Hand-craft a token missing `role` to bypass signJwt's own shape.
    const { SignJWT } = await import('jose');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('user-42')
      .setExpirationTime('1h')
      .sign(secret);

    await expect(verifyJwt(token)).resolves.toBeNull();
  });
});

describe('JWT_SECRET handling', () => {
  it('throws when unset in production', async () => {
    delete process.env.JWT_SECRET;
    (process.env as Record<string, string>).NODE_ENV = 'production';

    await expect(signJwt({ userId: 'u1', role: 'user' })).rejects.toThrow(/JWT_SECRET/);
  });

  it('falls back to an insecure dev secret (with a warning) outside production', async () => {
    delete process.env.JWT_SECRET;
    (process.env as Record<string, string>).NODE_ENV = 'development';
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const token = await signJwt({ userId: 'u1', role: 'user' });
    const verified = await verifyJwt(token);

    expect(verified?.userId).toBe('u1');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('JWT_SECRET is not set'));
    warnSpy.mockRestore();
  });

  it('rejects a secret shorter than 32 characters', async () => {
    process.env.JWT_SECRET = 'too-short';
    await expect(signJwt({ userId: 'u1', role: 'user' })).rejects.toThrow(/at least 32 characters/);
  });
});

describe('isAdminIdentity()', () => {
  afterEach(() => {
    delete process.env.ADMIN_EMAILS;
  });

  it('rejects a non-admin role outright', () => {
    expect(isAdminIdentity({ userId: 'u1', role: 'user' })).toBe(false);
  });

  it('accepts an admin role when no ADMIN_EMAILS allowlist is configured', () => {
    delete process.env.ADMIN_EMAILS;
    expect(isAdminIdentity({ userId: 'u1', role: 'admin' })).toBe(true);
  });

  it('requires the email to be on the allowlist when ADMIN_EMAILS is configured', () => {
    process.env.ADMIN_EMAILS = 'admin@lesaffre.com, ops@lesaffre.com';

    expect(isAdminIdentity({ userId: 'u1', role: 'admin', email: 'admin@lesaffre.com' })).toBe(true);
    expect(isAdminIdentity({ userId: 'u1', role: 'admin', email: 'nobody@example.com' })).toBe(false);
    expect(isAdminIdentity({ userId: 'u1', role: 'admin' })).toBe(false); // no email at all
  });

  it('allowlist matching is case-insensitive', () => {
    process.env.ADMIN_EMAILS = 'Admin@Lesaffre.com';
    expect(isAdminIdentity({ userId: 'u1', role: 'admin', email: 'admin@lesaffre.com' })).toBe(true);
  });
});

describe('authenticateApiKey()', () => {
  it('returns null when no x-api-key header is present, without querying the DB', async () => {
    const request = new Request('http://localhost/api/keys');
    const result = await authenticateApiKey(request);

    expect(result).toBeNull();
    expect(apiKeyManager.validateKey).not.toHaveBeenCalled();
  });

  it('delegates to apiKeyManager.validateKey with the header value', async () => {
    (apiKeyManager.validateKey as jest.Mock).mockResolvedValue({ id: 1, owner_email: 'a@b.com' });
    const request = new Request('http://localhost/api/keys', { headers: { 'x-api-key': 'lhr_abc123' } });

    const result = await authenticateApiKey(request);

    expect(apiKeyManager.validateKey).toHaveBeenCalledWith('lhr_abc123');
    expect(result).toEqual({ id: 1, owner_email: 'a@b.com' });
  });
});
