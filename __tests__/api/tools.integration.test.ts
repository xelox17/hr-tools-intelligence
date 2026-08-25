/**
 * Integration tests for GET/POST /api/tools against the real PostgreSQL
 * instance. Any tool this suite creates uses a `test-jest-` slug prefix
 * and is deleted again in afterAll, so it never pollutes the shared dev DB.
 */

import { GET, POST } from '@/app/api/tools/route';
import DatabaseManager from '@/lib/database';
import { buildRequest, readJson } from './helpers';

const TEST_SLUG_PREFIX = 'test-jest-tools-';

function uniqueSlug(): string {
  return `${TEST_SLUG_PREFIX}${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

afterAll(async () => {
  const db = DatabaseManager.getInstance();
  await db.connect();
  await db.query('DELETE FROM tools WHERE slug LIKE $1', [`${TEST_SLUG_PREFIX}%`]);
  await db.close();
});

describe('GET /api/tools (integration)', () => {
  it('returns a paginated list with the shape {items, total, page, pageSize, hasMore}', async () => {
    const response = await GET(buildRequest('/api/tools?page=1&pageSize=5'));
    const body = await readJson<{
      success: boolean;
      data: { items: unknown[]; total: number; page: number; pageSize: number; hasMore: boolean };
    }>(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.items)).toBe(true);
    expect(body.data.items.length).toBeLessThanOrEqual(5);
    expect(body.data.page).toBe(1);
    expect(body.data.pageSize).toBe(5);
    expect(typeof body.data.total).toBe('number');
  });

  it('filters by the search query param (case-insensitive name/category match)', async () => {
    const response = await GET(buildRequest('/api/tools?search=cornerstone'));
    const body = await readJson<{ data: { items: { name: string }[] } }>(response);

    expect(response.status).toBe(200);
    for (const tool of body.data.items) {
      expect(tool.name.toLowerCase()).toContain('cornerstone');
    }
  });

  it('caps pageSize at 100 even if a larger value is requested', async () => {
    const response = await GET(buildRequest('/api/tools?pageSize=500'));
    const body = await readJson<{ data: { pageSize: number } }>(response);

    expect(body.data.pageSize).toBe(100);
  });
});

describe('POST /api/tools (integration)', () => {
  it('creates a tool and returns 201 with the inserted row', async () => {
    const slug = uniqueSlug();
    const response = await POST(
      buildRequest('/api/tools', {
        method: 'POST',
        body: { name: `Jest Test Tool ${slug}`, slug, category: 'Testing', country: 'Global' },
      })
    );
    const body = await readJson<{ success: boolean; data: { id: string; slug: string; is_active: boolean } }>(
      response
    );

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.slug).toBe(slug);
    expect(body.data.is_active).toBe(true);
    expect(typeof body.data.id).toBe('string');
  });

  it('rejects a request missing the required "name" field with 400', async () => {
    const response = await POST(
      buildRequest('/api/tools', { method: 'POST', body: { slug: uniqueSlug(), category: 'Testing' } })
    );
    const body = await readJson<{ success: boolean; error: { code: string } }>(response);

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('BAD_REQUEST');
  });

  it('rejects a request missing the required "category" field with 400', async () => {
    const response = await POST(
      buildRequest('/api/tools', {
        method: 'POST',
        body: { name: 'No Category Tool', slug: uniqueSlug() },
      })
    );

    expect(response.status).toBe(400);
  });

  it('returns 409 when the slug already exists', async () => {
    const slug = uniqueSlug();
    const firstAttempt = await POST(
      buildRequest('/api/tools', {
        method: 'POST',
        body: { name: `Jest Dup Tool ${slug}`, slug, category: 'Testing' },
      })
    );
    expect(firstAttempt.status).toBe(201);

    const secondAttempt = await POST(
      buildRequest('/api/tools', {
        method: 'POST',
        body: { name: `Jest Dup Tool Again ${slug}`, slug, category: 'Testing' },
      })
    );
    const body = await readJson<{ success: boolean; error: { code: string } }>(secondAttempt);

    expect(secondAttempt.status).toBe(409);
    expect(body.error.code).toBe('CONFLICT');
  });
});
