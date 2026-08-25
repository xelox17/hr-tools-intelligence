/**
 * Input validation & sanitization (OWASP A03 — injection).
 *
 * `sanitizeString` strips `<script>` tags as defense-in-depth against
 * stored XSS. It deliberately does NOT strip SQL metacharacters (quotes,
 * semicolons, `--`): that would corrupt legitimate data (e.g. the last
 * name "O'Brien") and isn't how this codebase defends against SQL
 * injection anyway — every query in lib/*.ts and app/api/**\/route.ts uses
 * parameterized `$1, $2, ...` placeholders via `pg`, which is the actual,
 * effective defense. Blacklisting characters is a well-known weak and
 * bypassable pattern; `looksLikeSqlInjectionAttempt` below is a detector
 * for logging/alerting, not a mutator, for exactly this reason.
 */

const SCRIPT_TAG_RE = /<script\b[^>]*>[\s\S]*?<\/script>/gi;

export function sanitizeString(input: string): string {
  return input.replace(SCRIPT_TAG_RE, '').trim();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}

export function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** Flags common SQL-injection-attempt shapes for logging/alerting — does not mutate input. */
const SQLI_PATTERN_RE =
  /(\bOR\b\s+['"]?\d['"]?\s*=\s*['"]?\d['"]?|\bUNION\b\s+\bSELECT\b|;\s*DROP\s+TABLE)/i;

export function looksLikeSqlInjectionAttempt(value: string): boolean {
  return SQLI_PATTERN_RE.test(value);
}

export const MAX_PAYLOAD_BYTES = 1024 * 1024; // 1MB

/** Edge-safe: reads Content-Length, never buffers/consumes the body. */
export function isPayloadTooLarge(request: Request): boolean {
  const contentLength = request.headers.get('content-length');
  if (!contentLength) return false;
  const bytes = Number(contentLength);
  return Number.isFinite(bytes) && bytes > MAX_PAYLOAD_BYTES;
}
