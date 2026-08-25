/**
 * Unit tests for lib/api-keys.ts (APIKeyManager).
 *
 * DatabaseManager is mocked — no real Postgres needed.
 */

import { createHash } from 'node:crypto';
import DatabaseManager from '@/lib/database';
import { APIKeyManager } from '@/lib/api-keys';

jest.mock('@/lib/database');

function makeMockDb() {
  return { connect: jest.fn().mockResolvedValue(undefined), query: jest.fn() };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('generateKey()', () => {
  it('produces an "lhr_"-prefixed key and a matching SHA-256 hash', () => {
    const manager = new APIKeyManager();
    const { key, keyHash } = manager.generateKey();

    expect(key.startsWith('lhr_')).toBe(true);
    expect(keyHash).toBe(createHash('sha256').update(key).digest('hex'));
  });

  it('is a random 32-character key after the prefix', () => {
    const manager = new APIKeyManager();
    const { key } = manager.generateKey();

    expect(key).toHaveLength('lhr_'.length + 32);
  });

  it('generates a different key on every call', () => {
    const manager = new APIKeyManager();
    const first = manager.generateKey();
    const second = manager.generateKey();

    expect(first.key).not.toBe(second.key);
  });
});

describe('hashKey()', () => {
  it('is a deterministic, one-way SHA-256 hash', () => {
    const manager = new APIKeyManager();
    expect(manager.hashKey('lhr_test123')).toBe(
      createHash('sha256').update('lhr_test123').digest('hex')
    );
    // Same input -> same hash, every time.
    expect(manager.hashKey('lhr_test123')).toBe(manager.hashKey('lhr_test123'));
  });
});

describe('validateKey()', () => {
  it('returns null immediately for a key not shaped like ours, without querying the DB', async () => {
    const db = makeMockDb();
    (DatabaseManager.getInstance as jest.Mock).mockReturnValue(db);
    const manager = new APIKeyManager();

    const result = await manager.validateKey('not-our-prefix-abc');

    expect(result).toBeNull();
    expect(db.query).not.toHaveBeenCalled();
  });

  it('returns null when no active key matches the hash', async () => {
    const db = makeMockDb();
    db.query.mockResolvedValue({ rows: [] });
    (DatabaseManager.getInstance as jest.Mock).mockReturnValue(db);
    const manager = new APIKeyManager();

    const result = await manager.validateKey('lhr_unknownkey');

    expect(result).toBeNull();
  });

  it('returns the record and bumps last_used for a valid, unexpired key', async () => {
    const db = makeMockDb();
    const futureExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    db.query
      .mockResolvedValueOnce({
        rows: [{ id: 7, owner_email: 'anas@lesaffre.com', permissions: ['read'], expires_at: futureExpiry }],
      })
      .mockResolvedValueOnce({ rows: [] }); // last_used UPDATE
    (DatabaseManager.getInstance as jest.Mock).mockReturnValue(db);
    const manager = new APIKeyManager();

    const result = await manager.validateKey('lhr_validkey');

    expect(result?.id).toBe(7);
    // Fire-and-forget UPDATE — give the microtask queue a tick to run it.
    await Promise.resolve();
    expect(db.query).toHaveBeenCalledWith('UPDATE api_keys SET last_used = NOW() WHERE id = $1', [7]);
  });

  it('rejects a key that is past its expires_at, even if still marked active', async () => {
    const db = makeMockDb();
    const pastExpiry = new Date(Date.now() - 1000).toISOString();
    db.query.mockResolvedValueOnce({
      rows: [{ id: 7, owner_email: 'anas@lesaffre.com', permissions: [], expires_at: pastExpiry }],
    });
    (DatabaseManager.getInstance as jest.Mock).mockReturnValue(db);
    const manager = new APIKeyManager();

    const result = await manager.validateKey('lhr_expiredkey');

    expect(result).toBeNull();
  });

  it('accepts a key with no expires_at (never expires)', async () => {
    const db = makeMockDb();
    db.query
      .mockResolvedValueOnce({
        rows: [{ id: 7, owner_email: 'anas@lesaffre.com', permissions: [], expires_at: null }],
      })
      .mockResolvedValueOnce({ rows: [] });
    (DatabaseManager.getInstance as jest.Mock).mockReturnValue(db);
    const manager = new APIKeyManager();

    const result = await manager.validateKey('lhr_foreverkey');

    expect(result?.id).toBe(7);
  });
});

describe('createKey()', () => {
  it('inserts a key hash (never the plaintext) and defaults to 90-day expiry', async () => {
    const db = makeMockDb();
    db.query.mockResolvedValue({ rows: [{ id: 42 }] });
    (DatabaseManager.getInstance as jest.Mock).mockReturnValue(db);
    const manager = new APIKeyManager();

    const before = Date.now();
    const result = await manager.createKey({
      name: 'CI key',
      ownerEmail: 'anas@lesaffre.com',
      permissions: ['read', 'write'],
    });

    expect(result.keyId).toBe(42);
    expect(result.key.startsWith('lhr_')).toBe(true);

    const [insertedSql, insertedParams] = db.query.mock.calls[0];
    expect(insertedSql).toContain('INSERT INTO api_keys');
    expect(insertedParams[0]).toBe(manager.hashKey(result.key));
    expect(insertedParams[0]).not.toBe(result.key); // never store the plaintext

    const expiresAtMs = new Date(result.expiresAt).getTime();
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    expect(expiresAtMs).toBeGreaterThanOrEqual(before + ninetyDaysMs - 5000);
    expect(expiresAtMs).toBeLessThanOrEqual(before + ninetyDaysMs + 5000);
  });

  it('honors a custom expiresInDays', async () => {
    const db = makeMockDb();
    db.query.mockResolvedValue({ rows: [{ id: 1 }] });
    (DatabaseManager.getInstance as jest.Mock).mockReturnValue(db);
    const manager = new APIKeyManager();

    const before = Date.now();
    const result = await manager.createKey({
      name: 'Short-lived key',
      ownerEmail: 'anas@lesaffre.com',
      permissions: ['read'],
      expiresInDays: 7,
    });

    const expiresAtMs = new Date(result.expiresAt).getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    expect(expiresAtMs).toBeGreaterThanOrEqual(before + sevenDaysMs - 5000);
    expect(expiresAtMs).toBeLessThanOrEqual(before + sevenDaysMs + 5000);
  });
});

describe('revokeKey()', () => {
  it('returns true when a row was updated', async () => {
    const db = makeMockDb();
    db.query.mockResolvedValue({ rows: [{ id: 5 }] });
    (DatabaseManager.getInstance as jest.Mock).mockReturnValue(db);
    const manager = new APIKeyManager();

    await expect(manager.revokeKey(5)).resolves.toBe(true);
    expect(db.query).toHaveBeenCalledWith(
      'UPDATE api_keys SET is_active = false WHERE id = $1 RETURNING id',
      [5]
    );
  });

  it('returns false when the id does not exist', async () => {
    const db = makeMockDb();
    db.query.mockResolvedValue({ rows: [] });
    (DatabaseManager.getInstance as jest.Mock).mockReturnValue(db);
    const manager = new APIKeyManager();

    await expect(manager.revokeKey(999)).resolves.toBe(false);
  });
});

describe('listKeys()', () => {
  it('returns every key including its hash, ordered by created_at desc (per the SQL query)', async () => {
    const db = makeMockDb();
    db.query.mockResolvedValue({
      rows: [{ id: 2, key_hash: 'hash2' }, { id: 1, key_hash: 'hash1' }],
    });
    (DatabaseManager.getInstance as jest.Mock).mockReturnValue(db);
    const manager = new APIKeyManager();

    const keys = await manager.listKeys();

    expect(keys).toHaveLength(2);
    expect(keys[0].key_hash).toBe('hash2');
    expect(db.query.mock.calls[0][0]).toContain('ORDER BY created_at DESC');
  });
});
