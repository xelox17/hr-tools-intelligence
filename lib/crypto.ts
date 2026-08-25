import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * AES-256-GCM encrypt/decrypt for values that must be *recoverable* later —
 * e.g. tool_integrations.api_key_encrypted / secret_encrypted / etc., which
 * the connectors need to read back in plaintext to call a third-party API.
 *
 * This is NOT for API key storage (lib/api-keys.ts) — API keys are one-way
 * SHA-256 hashed, never encrypted/decrypted, per docs/SECURITY.md.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV, the GCM-recommended size
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      'ENCRYPTION_KEY is not set. Generate one with: openssl rand -base64 32 (see .env.example).'
    );
  }

  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must decode to exactly 32 bytes for AES-256 (got ${key.length}). ` +
        'Generate one with: openssl rand -base64 32.'
    );
  }
  return key;
}

/**
 * Encrypts a UTF-8 string. Returns `iv:authTag:ciphertext`, each base64,
 * colon-separated — a single string that fits a TEXT column.
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join(':');
}

/** Decrypts a string produced by `encrypt()`. Throws if it was tampered with. */
export function decrypt(encrypted: string): string {
  const key = getEncryptionKey();
  const parts = encrypted.split(':');
  if (parts.length !== 3) {
    throw new Error('Malformed encrypted value: expected "iv:authTag:ciphertext".');
  }
  const [ivB64, authTagB64, ciphertextB64] = parts;

  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, 'base64'), {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, 'base64')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}
