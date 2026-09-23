/**
 * POST /api/ai/chat — HR chatbot endpoint, streamed as Server-Sent Events.
 *
 * Backed by Google Gemini (free tier) instead of Anthropic. The SSE
 * protocol the client (hooks/useChat.ts, both the Next.js app and the
 * Power Apps code app) already speaks is unchanged:
 *
 *   data: {"type":"text","text":"..."}      (repeated)
 *   data: {"type":"done","meta":{...}}      (last event)
 *   data: {"type":"error","message":"..."}  (stream failure)
 *
 * Escalation and the GDPR sensitive-data notice are delivered as text
 * inside that same stream (not a separate non-streamed JSON response) —
 * useChat.ts only ever parses `data: {...}` SSE lines, so a plain JSON
 * body would render as nothing in the chat.
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

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse`;

const ESCALATION_REPLY =
  'Cette question relève d’un sujet sensible : je vous invite à contacter directement votre équipe RH, qui pourra vous répondre de façon confidentielle.\n\nEmail : hr@lesaffre.com';
const SENSITIVE_DATA_NOTICE =
  'Votre message semble contenir des données personnelles sensibles. Pour votre sécurité, évitez de les partager ici.\n\n';

const encoder = new TextEncoder();
function sseEvent(payload: Record<string, unknown>): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

/** Streams a plain string as a single SSE "text" event, then "done". No Gemini call. */
function streamStaticReply(text: string, meta: Record<string, unknown>): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(sseEvent({ type: 'text', text }));
      controller.enqueue(sseEvent({ type: 'done', meta }));
      controller.close();
    },
  });
}

interface GeminiHistoryEntry {
  role: 'user' | 'assistant';
  content: string;
}

/** Calls Gemini's streaming endpoint and re-emits each text delta as our own SSE "text" events. */
function streamGeminiReply(
  systemPrompt: string,
  history: GeminiHistoryEntry[],
  message: string,
  prefix: string,
  meta: Record<string, unknown>
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (prefix) controller.enqueue(sseEvent({ type: 'text', text: prefix }));

        const contents = [
          ...history.map((entry) => ({
            role: entry.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: entry.content }],
          })),
          { role: 'user', parts: [{ text: message }] },
        ];

        const geminiRes = await fetch(GEMINI_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY! },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: {
              maxOutputTokens: 1024,
              temperature: 0.7,
              // Gemini 3's models "think" before answering by default, which
              // measured ~50s of latency on a two-sentence HR question — most
              // of it invisible reasoning, not the visible reply. This is a
              // chat widget, not a research tool: disabling it cut the same
              // request to ~11s with no visible loss in answer quality.
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        });

        if (!geminiRes.ok || !geminiRes.body) {
          const errText = await geminiRes.text().catch(() => '');
          console.error('[ai-chat] Gemini error:', geminiRes.status, errText.slice(0, 500));
          controller.enqueue(sseEvent({ type: 'error', message: 'Le service IA est momentanément indisponible.' }));
          controller.close();
          return;
        }

        const reader = geminiRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let tokensUsed: number | undefined;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const jsonStr = trimmed.slice(5).trim();
            if (!jsonStr || jsonStr === '[DONE]') continue;

            try {
              const data = JSON.parse(jsonStr);
              const parts = data?.candidates?.[0]?.content?.parts;
              const text = Array.isArray(parts) ? parts.map((p: { text?: string }) => p.text ?? '').join('') : '';
              if (text) controller.enqueue(sseEvent({ type: 'text', text }));
              if (data?.usageMetadata?.totalTokenCount) tokensUsed = data.usageMetadata.totalTokenCount;
            } catch {
              // A partial/malformed SSE chunk — skip it, next chunk usually completes it.
            }
          }
        }

        controller.enqueue(sseEvent({ type: 'done', meta: { ...meta, tokensUsed } }));
        controller.close();
      } catch (error) {
        console.error('[ai-chat] stream failed:', error instanceof Error ? error.message : 'unknown');
        controller.enqueue(sseEvent({ type: 'error', message: 'Stream interrupted.' }));
        controller.close();
      }
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

  if (!GEMINI_API_KEY) {
    console.error('[ai-chat] GEMINI_API_KEY is not configured.');
    return errorResponse('CONFIG_ERROR', "Le service IA n'est pas configuré (GEMINI_API_KEY manquante).", null, 500);
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

    const meta = {
      mode: context.mode,
      escalated: escalation.escalate,
      escalationReason: escalation.reason ?? null,
      sensitiveDataDetected: sensitiveTypes.length > 0,
      systemPromptChars: systemPrompt.length,
      model: GEMINI_MODEL,
    };
    console.info('[ai-chat]', buildSafeLogMeta(input, meta));

    // Escalation skips the LLM call entirely — cheaper and matches the
    // "route straight to a human for sensitive topics" intent.
    const stream = escalation.escalate
      ? streamStaticReply(ESCALATION_REPLY, meta)
      : streamGeminiReply(
          systemPrompt,
          input.conversationHistory,
          input.message,
          sensitiveTypes.length > 0 ? SENSITIVE_DATA_NOTICE : '',
          meta
        );

    return new Response(stream, {
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
