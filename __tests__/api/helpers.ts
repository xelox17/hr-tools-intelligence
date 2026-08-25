import { NextRequest } from 'next/server';

/**
 * Builds a NextRequest for calling an App Router route handler directly
 * (no server/socket needed — handlers are just async functions). Shared
 * across the integration test files in this directory.
 */
export function buildRequest(
  path: string,
  init?: { method?: string; body?: unknown; headers?: Record<string, string> }
): NextRequest {
  const { method = 'GET', body, headers } = init ?? {};
  return new NextRequest(`http://localhost:3000${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function readJson<T = Record<string, unknown>>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}
