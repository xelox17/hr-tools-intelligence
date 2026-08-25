import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import DatabaseManager from '@/lib/database';
import { isValidWebhookUrl } from '@/lib/webhooks';

interface TestRequestBody {
  subscriptionId?: string;
  url?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TestRequestBody = await request.json();

    let targetUrl = body.url;

    if (!targetUrl && body.subscriptionId) {
      const db = DatabaseManager.getInstance();
      await db.connect();

      const result = await db.query<{ url: string }>(
        'SELECT url FROM webhooks_subscriptions WHERE id = $1',
        [body.subscriptionId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: `Subscription "${body.subscriptionId}" not found.` },
          { status: 404 }
        );
      }

      targetUrl = result.rows[0].url;
    }

    if (!targetUrl) {
      return NextResponse.json(
        { success: false, error: 'Provide either "subscriptionId" or "url".' },
        { status: 400 }
      );
    }

    if (!isValidWebhookUrl(targetUrl)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Webhook url must be HTTPS, or http://localhost / http://127.0.0.1 for local testing.',
        },
        { status: 400 }
      );
    }

    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: { message: 'This is a test event from Lesaffre HR Tools.' },
    };

    const startTime = Date.now();

    try {
      const response = await axios.post(targetUrl, testPayload, { timeout: 30000 });
      const responseTime = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        statusCode: response.status,
        responseTime,
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const statusCode = axios.isAxiosError(error) ? (error.response?.status ?? null) : null;
      const message = error instanceof Error ? error.message : 'Unknown error';

      console.error(`❌ [webhooks/test] Test delivery to ${targetUrl} failed: ${message}`);

      return NextResponse.json({
        success: false,
        statusCode,
        responseTime,
        error: message,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ [webhooks/test] Request failed: ${message}`);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
