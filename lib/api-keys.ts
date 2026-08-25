import { createHash, randomBytes } from 'node:crypto';
import DatabaseManager from '@/lib/database';

const KEY_PREFIX = 'lhr_';
const KEY_RANDOM_BYTES = 24; // base64url-encodes to exactly 32 chars, no padding
const DEFAULT_EXPIRY_DAYS = 90;

export interface GeneratedApiKey {
  /** Full plaintext key — only ever available at creation time. Never stored. */
  key: string;
  keyHash: string;
}

export interface ApiKeyRecord {
  id: number;
  key_hash: string;
  name: string | null;
  description: string | null;
  owner_email: string;
  permissions: string[];
  last_used: string | null;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

export interface CreateApiKeyParams {
  name: string;
  ownerEmail: string;
  permissions: string[];
  /** Days until expiry. Defaults to 90 (this project's key-rotation policy). */
  expiresInDays?: number;
}

export class APIKeyManager {
  /** Generates a new `lhr_`-prefixed key and its storage hash. Does not touch the DB. */
  generateKey(): GeneratedApiKey {
    const random = randomBytes(KEY_RANDOM_BYTES).toString('base64url');
    const key = `${KEY_PREFIX}${random}`;
    return { key, keyHash: this.hashKey(key) };
  }

  /** One-way SHA-256 hash used for storage/lookup — keys are never stored or decrypted. */
  hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  /**
   * Looks up a presented key by its hash, and returns the record only if
   * it's active and not expired. Bumps `last_used` (fire-and-forget) on a hit.
   */
  async validateKey(key: string): Promise<ApiKeyRecord | null> {
    if (!key.startsWith(KEY_PREFIX)) return null;

    const db = DatabaseManager.getInstance();
    await db.connect();

    const result = await db.query<ApiKeyRecord>(
      `SELECT id, key_hash, name, description, owner_email, permissions, last_used, is_active, created_at, expires_at
       FROM api_keys
       WHERE key_hash = $1 AND is_active = true`,
      [this.hashKey(key)]
    );

    const record = result.rows[0];
    if (!record) return null;
    if (record.expires_at && new Date(record.expires_at).getTime() <= Date.now()) {
      return null;
    }

    db.query('UPDATE api_keys SET last_used = NOW() WHERE id = $1', [record.id]).catch((error) => {
      console.error('❌ [APIKeyManager] Failed to update last_used:', error);
    });

    return record;
  }

  /** Creates and persists a new key. Returns the plaintext key exactly once. */
  async createKey(
    params: CreateApiKeyParams
  ): Promise<{ key: string; keyId: number; expiresAt: string }> {
    const { key, keyHash } = this.generateKey();
    const expiresInDays = params.expiresInDays ?? DEFAULT_EXPIRY_DAYS;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const db = DatabaseManager.getInstance();
    await db.connect();

    const result = await db.query<{ id: number }>(
      `INSERT INTO api_keys (key_hash, name, owner_email, permissions, is_active, expires_at)
       VALUES ($1, $2, $3, $4, true, $5)
       RETURNING id`,
      [keyHash, params.name, params.ownerEmail, params.permissions, expiresAt]
    );

    return { key, keyId: result.rows[0].id, expiresAt: expiresAt.toISOString() };
  }

  /** Revokes (soft-deletes) a key. Returns false if the id doesn't exist. */
  async revokeKey(keyId: number): Promise<boolean> {
    const db = DatabaseManager.getInstance();
    await db.connect();
    const result = await db.query('UPDATE api_keys SET is_active = false WHERE id = $1 RETURNING id', [
      keyId,
    ]);
    return result.rows.length > 0;
  }

  /** Lists all keys — hashes only, never the plaintext key (which isn't stored anyway). */
  async listKeys(): Promise<ApiKeyRecord[]> {
    const db = DatabaseManager.getInstance();
    await db.connect();

    const result = await db.query<ApiKeyRecord>(
      `SELECT id, key_hash, name, description, owner_email, permissions, last_used, is_active, created_at, expires_at
       FROM api_keys
       ORDER BY created_at DESC`
    );
    return result.rows;
  }
}

export const apiKeyManager = new APIKeyManager();
