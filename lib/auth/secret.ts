/**
 * JWT signing secret, shared by the API bearer tokens (middleware/auth.ts) and
 * the browser session cookie (lib/auth/session.ts). Kept in its own module so
 * the session code does not pull in the Postgres client.
 */

const DEV_ONLY_FALLBACK_SECRET = 'dev-secret-min-32-characters-long-not-for-prod';

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is not set. Refusing to run in production without it.');
    }
    console.warn(
      '⚠️ [auth] JWT_SECRET is not set — using an insecure dev-only fallback. Set JWT_SECRET before deploying (see .env.example).'
    );
    return new TextEncoder().encode(DEV_ONLY_FALLBACK_SECRET);
  }

  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters (HS256 minimum key strength).');
  }

  return new TextEncoder().encode(secret);
}
