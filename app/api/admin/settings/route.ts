import { NextRequest } from 'next/server';
import DatabaseManager from '@/lib/database';
import { successResponse, ErrorResponses } from '@/lib/response';
import { auditLog } from '@/middleware/audit-log';

// middleware.ts already requires a valid Bearer token + admin role for
// every /api/admin/* path before this handler runs. Re-checked here too
// (defense in depth — see the same note in app/api/keys/route.ts).
// MFA on top of the admin-role check is documented as a future
// enhancement in docs/SECURITY.md — not implemented yet.
function requireAdmin(request: NextRequest): { userId: string } | null {
  const userId = request.headers.get('x-user-id');
  const role = request.headers.get('x-user-role');
  return userId && role === 'admin' ? { userId } : null;
}

interface SettingsRow {
  rate_limit_enabled: boolean;
  rate_limit_public_per_minute: number;
  rate_limit_authenticated_per_minute: number;
  rate_limit_per_api_key_per_minute: number;
  cors_allowed_origins: string[];
  security_headers_enabled: boolean;
  updated_at: string | null;
  updated_by: string | null;
}

const PATCHABLE_COLUMNS: Record<string, 'boolean' | 'number' | 'string[]'> = {
  rate_limit_enabled: 'boolean',
  rate_limit_public_per_minute: 'number',
  rate_limit_authenticated_per_minute: 'number',
  rate_limit_per_api_key_per_minute: 'number',
  cors_allowed_origins: 'string[]',
  security_headers_enabled: 'boolean',
};

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) {
    return ErrorResponses.forbidden();
  }

  try {
    const db = DatabaseManager.getInstance();
    await db.connect();
    const result = await db.query<SettingsRow>('SELECT * FROM security_settings WHERE id = 1');
    return successResponse(result.rows[0]);
  } catch (error) {
    console.error('❌ Failed to load security settings:', error);
    return ErrorResponses.internalError('Failed to load security settings', error);
  }
}

export async function PATCH(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) {
    return ErrorResponses.forbidden();
  }

  try {
    const body: Record<string, unknown> = await request.json();

    const setClauses: string[] = [];
    const params: unknown[] = [];

    for (const [column, type] of Object.entries(PATCHABLE_COLUMNS)) {
      if (!(column in body)) continue;
      const value = body[column];

      if (type === 'boolean' && typeof value !== 'boolean') {
        return ErrorResponses.badRequest(`"${column}" must be a boolean.`);
      }
      if (type === 'number' && (typeof value !== 'number' || value <= 0)) {
        return ErrorResponses.badRequest(`"${column}" must be a positive number.`);
      }
      if (type === 'string[]' && (!Array.isArray(value) || value.some((v) => typeof v !== 'string'))) {
        return ErrorResponses.badRequest(`"${column}" must be an array of strings.`);
      }

      params.push(value);
      setClauses.push(`${column} = $${params.length}`);
    }

    if (setClauses.length === 0) {
      return ErrorResponses.badRequest(
        `No recognized fields in body. Expected one or more of: ${Object.keys(PATCHABLE_COLUMNS).join(', ')}.`
      );
    }

    const db = DatabaseManager.getInstance();
    await db.connect();

    const before = await db.query<SettingsRow>('SELECT * FROM security_settings WHERE id = 1');

    params.push(admin.userId);
    const result = await db.query<SettingsRow>(
      `UPDATE security_settings
       SET ${setClauses.join(', ')}, updated_at = NOW(), updated_by = $${params.length}
       WHERE id = 1
       RETURNING *`,
      params
    );

    await auditLog({
      resourceType: 'security_settings',
      action: 'UPDATE',
      oldValues: before.rows[0],
      newValues: result.rows[0],
      changedBy: admin.userId,
      ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
    });

    return successResponse(result.rows[0]);
  } catch (error) {
    console.error('❌ Failed to update security settings:', error);
    return ErrorResponses.internalError('Failed to update security settings', error);
  }
}
