import { NextRequest } from 'next/server';
import { RequestContext } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-min-32-characters-long';

export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

export function authenticateRequest(
  request: NextRequest
): RequestContext | null {
  const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';

  return {
    userId: 'dev-user',
    userEmail: 'dev@lesaffre.com',
    userRole: 'admin',
    requestId: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
    ipAddress,
  };
}

export function withAuth(
  handler: (
    request: NextRequest,
    context: RequestContext
  ) => Promise<Response>
) {
  return async (request: NextRequest) => {
    const context = authenticateRequest(request);

    if (!context) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Missing or invalid authentication',
          },
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return handler(request, context);
  };
}