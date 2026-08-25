import { NextRequest, NextResponse } from 'next/server';
import { apiKeyManager } from '@/lib/api-keys';
import { successResponse, ErrorResponses } from '@/lib/response';
import { isValidEmail } from '@/middleware/validation';
import { auditLog } from '@/middleware/audit-log';

// Auth (and, per middleware.ts's AUTH_REQUIRED_PREFIXES, a valid Bearer
// token) is already enforced before this handler runs — these headers are
// the identity middleware.ts attached. Re-checked here too (defense in
// depth: never trust that every caller of this handler goes through the
// same middleware, e.g. in tests).
function requireIdentity(request: NextRequest): { userId: string } | null {
  const userId = request.headers.get('x-user-id');
  return userId ? { userId } : null;
}

interface CreateKeyBody {
  name?: string;
  ownerEmail?: string;
  permissions?: string[];
  expiresIn?: number;
}

export async function GET(request: NextRequest) {
  if (!requireIdentity(request)) {
    return ErrorResponses.unauthorized();
  }

  try {
    const keys = await apiKeyManager.listKeys();
    return successResponse({
      keys: keys.map((k) => ({
        id: k.id,
        keyHash: k.key_hash,
        name: k.name,
        ownerEmail: k.owner_email,
        permissions: k.permissions,
        isActive: k.is_active,
        lastUsed: k.last_used,
        createdAt: k.created_at,
        expiresAt: k.expires_at,
      })),
    });
  } catch (error) {
    console.error('❌ Failed to list API keys:', error);
    return ErrorResponses.internalError('Failed to list API keys', error);
  }
}

export async function POST(request: NextRequest) {
  const identity = requireIdentity(request);
  if (!identity) {
    return ErrorResponses.unauthorized();
  }

  try {
    const body: CreateKeyBody = await request.json();

    if (!body.name || typeof body.name !== 'string') {
      return ErrorResponses.badRequest('A "name" field is required.');
    }
    if (!body.ownerEmail || !isValidEmail(body.ownerEmail)) {
      return ErrorResponses.badRequest('A valid "ownerEmail" field is required.');
    }
    if (!Array.isArray(body.permissions) || body.permissions.length === 0) {
      return ErrorResponses.badRequest('A non-empty "permissions" array is required.');
    }
    if (body.expiresIn !== undefined && (typeof body.expiresIn !== 'number' || body.expiresIn <= 0)) {
      return ErrorResponses.badRequest('"expiresIn" must be a positive number of days.');
    }

    const created = await apiKeyManager.createKey({
      name: body.name,
      ownerEmail: body.ownerEmail,
      permissions: body.permissions,
      expiresInDays: body.expiresIn,
    });

    await auditLog({
      resourceType: 'api_key',
      action: 'CREATE',
      newValues: { keyId: created.keyId, name: body.name, ownerEmail: body.ownerEmail, permissions: body.permissions },
      changedBy: identity.userId,
      ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
    });

    // Flat shape by design — the plaintext key is shown exactly once.
    return NextResponse.json(
      { success: true, key: created.key, keyId: created.keyId, expiresAt: created.expiresAt },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Failed to create API key:', error);
    return ErrorResponses.internalError('Failed to create API key', error);
  }
}

export async function DELETE(request: NextRequest) {
  const identity = requireIdentity(request);
  if (!identity) {
    return ErrorResponses.unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const keyId = searchParams.get('id');
  if (!keyId || Number.isNaN(Number(keyId))) {
    return ErrorResponses.badRequest('Query param "id" (numeric) is required.');
  }

  try {
    const revoked = await apiKeyManager.revokeKey(Number(keyId));
    if (!revoked) {
      return ErrorResponses.notFound(`API key "${keyId}"`);
    }

    await auditLog({
      resourceType: 'api_key',
      action: 'REVOKE',
      newValues: { keyId: Number(keyId) },
      changedBy: identity.userId,
      ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
    });

    return successResponse({ revoked: true, keyId: Number(keyId) });
  } catch (error) {
    console.error('❌ Failed to revoke API key:', error);
    return ErrorResponses.internalError('Failed to revoke API key', error);
  }
}
