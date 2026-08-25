import { NextRequest, NextResponse } from 'next/server';
import DatabaseManager from '@/lib/database';
import { ALLOWED_WEBHOOK_EVENTS, isKnownWebhookEvent, isValidWebhookUrl } from '@/lib/webhooks';
import { successResponse, ErrorResponses } from '@/lib/response';

interface SubscribeRequestBody {
  url?: string;
  events?: string[];
  name?: string;
}

export async function GET() {
  try {
    const db = DatabaseManager.getInstance();
    await db.connect();

    const result = await db.query(
      `SELECT id, name, url, events, is_active, created_at
       FROM webhooks_subscriptions
       ORDER BY created_at DESC`
    );

    return successResponse({ subscriptions: result.rows });
  } catch (error) {
    console.error('❌ Failed to list webhook subscriptions:', error);
    return ErrorResponses.internalError('Failed to list webhook subscriptions', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SubscribeRequestBody = await request.json();

    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'A "url" field is required.' },
        { status: 400 }
      );
    }

    if (!isValidWebhookUrl(body.url)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Webhook url must be HTTPS, or http://localhost / http://127.0.0.1 for local testing.',
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.events) || body.events.length === 0) {
      return NextResponse.json(
        { success: false, error: 'A non-empty "events" array is required.' },
        { status: 400 }
      );
    }

    const invalidEvents = body.events.filter((event) => !isKnownWebhookEvent(event));
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Unknown event(s): ${invalidEvents.join(', ')}. Expected one of: ${ALLOWED_WEBHOOK_EVENTS.join(', ')}.`,
        },
        { status: 400 }
      );
    }

    const db = DatabaseManager.getInstance();
    await db.connect();

    const result = await db.query<{ id: string }>(
      `INSERT INTO webhooks_subscriptions (name, url, events, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING id`,
      [body.name ?? null, body.url, body.events]
    );

    const subscriptionId = result.rows[0].id;

    return NextResponse.json({
      success: true,
      subscriptionId,
      webhook_url: body.url,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ [webhooks/subscribe] Failed to create subscription: ${message}`);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
