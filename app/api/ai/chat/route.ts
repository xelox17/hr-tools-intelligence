/**
 * POST /api/ai/chat — HR chatbot endpoint, streamed as Server-Sent Events.
 *
 * PHASE 1 (DEMO): the Anthropic call is replaced by a canned reply. The rest
 * of the pipeline (validation, rate limit, escalation, context + system
 * prompt) is real, so the client already speaks the final protocol:
 *
 *   data: {"type":"text","text":"..."}      (repeated)
 *   data: {"type":"done","meta":{...}}      (last event)
 *   data: {"type":"error","message":"..."}  (stream failure)
 *
 * To go live, replace `streamDemoReply` with a call to
 * `client.messages.stream({ system: systemPrompt, messages, ... })` from
 * @anthropic-ai/sdk and forward each text delta as a "text" event.
 */

import type { NextRequest } from 'next/server';
import { errorResponse } from '@/lib/response';
import { getClientIp, isRateLimitingEnabled } from '@/middleware/rate-limit';
import { buildContextData } from '@/lib/ai/context-builder';
import { buildSystemPrompt } from '@/lib/ai/system-prompt';
import {
  buildSafeLogMeta,
  checkChatRateLimit,
  checkEscalation,
  detectSensitiveData,
  validateChatInput,
} from '@/lib/ai/safety';

const DEMO_REPLY =
  'Mode démo - API non configurée. Connectez ANTHROPIC_API_KEY en production.';
const ESCALATION_REPLY =
  'Cette question relève d’un sujet sensible : je vous invite à contacter directement votre équipe RH, qui pourra vous répondre de façon confidentielle.';
const SENSITIVE_DATA_NOTICE =
  'Votre message semble contenir des données personnelles sensibles. Pour votre sécurité, évitez de les partager ici.';

const CHUNK_DELAY_MS = 25;
const encoder = new TextEncoder();

function sseEvent(payload: Record<string, unknown>): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Streams `text` word by word, mimicking the token stream of the real API. */
function streamDemoReply(text: string, meta: Record<string, unknown>): ReadableStream<Uint8Array> {
  let cancelled = false;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (const word of text.match(/\S+\s*/g) ?? []) {
          if (cancelled) return;
          controller.enqueue(sseEvent({ type: 'text', text: word }));
          await sleep(CHUNK_DELAY_MS);
        }
        if (!cancelled) {
          controller.enqueue(sseEvent({ type: 'done', meta }));
          controller.close();
        }
      } catch (error) {
        console.error('[ai-chat] stream failed:', error instanceof Error ? error.message : 'unknown');
        if (!cancelled) {
          controller.enqueue(sseEvent({ type: 'error', message: 'Stream interrupted.' }));
          controller.close();
        }
      }
    },
    cancel() {
      cancelled = true;
    },
  });
}

export async function POST(request: NextRequest) {
  if (isRateLimitingEnabled()) {
    const limit = await checkChatRateLimit(getClientIp(request));
    if (!limit.allowed) {
      const response = errorResponse(
        'RATE_LIMITED',
        'Trop de requêtes. Réessayez dans une minute.',
        null,
        429
      );
      response.headers.set('Retry-After', String(Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000))));
      return response;
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('BAD_REQUEST', 'Request body must be valid JSON.', null, 400);
  }

  const validation = validateChatInput(body);
  if (!validation.ok) {
    return errorResponse(validation.code, validation.message, null, 400);
  }
  const input = validation.value;

  try {
    const context = await buildContextData(input.employeeId, 'demo');
    const systemPrompt = buildSystemPrompt(context);

    const escalation = checkEscalation(input.message);
    const sensitiveTypes = detectSensitiveData(input.message);

    const reply = [
      sensitiveTypes.length > 0 ? SENSITIVE_DATA_NOTICE : null,
      escalation.escalate ? ESCALATION_REPLY : null,
      DEMO_REPLY,
    ]
      .filter(Boolean)
      .join('\n\n');

    const meta = {
      mode: context.mode,
      escalated: escalation.escalate,
      escalationReason: escalation.reason ?? null,
      sensitiveDataDetected: sensitiveTypes.length > 0,
      systemPromptChars: systemPrompt.length,
    };
    console.info('[ai-chat]', buildSafeLogMeta(input, meta));

    return new Response(streamDemoReply(reply, meta), {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[ai-chat] failed:', error instanceof Error ? error.message : 'unknown');
    return errorResponse('INTERNAL_ERROR', 'L’assistant est temporairement indisponible.', null, 500);
  }
}
