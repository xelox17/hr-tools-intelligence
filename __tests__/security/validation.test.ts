/**
 * Unit tests for middleware/validation.ts.
 */

import {
  sanitizeString,
  isValidEmail,
  isValidUrl,
  isValidUuid,
  isPayloadTooLarge,
  looksLikeSqlInjectionAttempt,
  MAX_PAYLOAD_BYTES,
} from '@/middleware/validation';

describe('sanitizeString()', () => {
  it('strips <script> tags', () => {
    expect(sanitizeString('hello <script>alert(1)</script> world')).toBe('hello  world');
  });

  it('strips a script tag with attributes', () => {
    expect(sanitizeString('<script src="evil.js"></script>ok')).toBe('ok');
  });

  it('trims surrounding whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  it('does NOT strip legitimate apostrophes or quotes — SQL injection is prevented via parameterized queries, not character-blacklisting', () => {
    expect(sanitizeString("O'Brien")).toBe("O'Brien");
    expect(sanitizeString('She said "hello"')).toBe('She said "hello"');
  });

  it('leaves ordinary text untouched', () => {
    expect(sanitizeString('Cornerstone LMS')).toBe('Cornerstone LMS');
  });
});

describe('isValidEmail()', () => {
  it.each([
    ['anas@lesaffre.com', true],
    ['a.b+tag@sub.example.co', true],
    ['not-an-email', false],
    ['missing@domain', false],
    ['@no-local-part.com', false],
    ['spaces in@email.com', false],
    ['', false],
  ])('isValidEmail(%s) => %s', (value, expected) => {
    expect(isValidEmail(value)).toBe(expected);
  });
});

describe('isValidUrl()', () => {
  it.each([
    ['https://example.com', true],
    ['http://localhost:3000/hook', true],
    ['ftp://example.com', true], // any parseable URL — scheme restriction is isValidWebhookUrl's job, not this one's
    ['not a url', false],
    ['', false],
  ])('isValidUrl(%s) => %s', (value, expected) => {
    expect(isValidUrl(value)).toBe(expected);
  });
});

describe('isValidUuid()', () => {
  it.each([
    ['a9b7084b-f328-4be6-a00b-150d342c5b6b', true],
    ['A9B7084B-F328-4BE6-A00B-150D342C5B6B', true],
    ['not-a-uuid', false],
    ['a9b7084b-f328-4be6-a00b-150d342c5b6', false], // one char short
    ['', false],
  ])('isValidUuid(%s) => %s', (value, expected) => {
    expect(isValidUuid(value)).toBe(expected);
  });
});

describe('looksLikeSqlInjectionAttempt()', () => {
  it.each([
    ["' OR 1=1", true],
    ["' OR '1'='1", true],
    ['UNION SELECT password FROM users', true],
    ['; DROP TABLE tools', true],
    ['Cornerstone LMS', false],
    ["O'Brien", false], // a lone apostrophe is not, by itself, an injection pattern
  ])('looksLikeSqlInjectionAttempt(%s) => %s', (value, expected) => {
    expect(looksLikeSqlInjectionAttempt(value)).toBe(expected);
  });
});

describe('isPayloadTooLarge()', () => {
  it('returns false when there is no Content-Length header', () => {
    const request = new Request('http://localhost/api/tools', { method: 'POST' });
    expect(isPayloadTooLarge(request)).toBe(false);
  });

  it('returns false for a payload at or under the 1MB limit', () => {
    const request = new Request('http://localhost/api/tools', {
      method: 'POST',
      headers: { 'content-length': String(MAX_PAYLOAD_BYTES) },
    });
    expect(isPayloadTooLarge(request)).toBe(false);
  });

  it('returns true for a payload over the 1MB limit', () => {
    const request = new Request('http://localhost/api/tools', {
      method: 'POST',
      headers: { 'content-length': String(MAX_PAYLOAD_BYTES + 1) },
    });
    expect(isPayloadTooLarge(request)).toBe(true);
  });
});
