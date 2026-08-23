import { successResponse } from '@/lib/response';
import DatabaseManager from '@/lib/database';

export async function GET() {
  const startTime = Date.now();

  try {
    const db = DatabaseManager.getInstance();
    await db.connect();

    await db.query(`SELECT NOW() as server_time`);

    const durationMs = Date.now() - startTime;

    return successResponse(
      {
        status: 'healthy',
        version: '1.0.0',
        uptime: process.uptime(),
        database: {
          connected: true,
          responseTime_ms: durationMs,
        },
        timestamp: new Date().toISOString(),
      },
      { took_ms: durationMs }
    );
  } catch (error) {
    console.error('❌ Health check failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        error: message,
      }),
      { status: 503 }
    );
  }
}
