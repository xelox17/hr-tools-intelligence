/**
 * POST /api/ai/chat-sync — same HR chatbot as /api/ai/chat, but a single
 * plain JSON response instead of an SSE stream:
 *
 *   { "success": true, "reply": "...", "meta": {...} }
 *   { "success": false, "error": "..." }
 *
 * Exists for callers that can't consume `text/event-stream` — specifically
 * a Power Automate "HTTP" action inside the flow the Power Apps code app
 * calls (see my-app/src/hooks/useFlowChat.ts), since the published Power
 * Apps player sandboxes direct fetch() to an external origin and Power
 * Automate's designer has no simple way to parse SSE either. The browser
 * clients (Next.js app, Power Apps code app running locally) keep using
 * the streaming /api/ai/chat.
 *
 * Shares the exact same safety pipeline and prompt-building as
 * /api/ai/chat — only the transport differs.
 */

import type { NextRequest } from 'next/server';
import { errorResponse, successResponse } from '@/lib/response';
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
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const ESCALATION_REPLY: Record<string, string> = {
  fr: 'Cette question relève d’un sujet sensible : je vous invite à contacter directement votre équipe RH, qui pourra vous répondre de façon confidentielle.\n\nEmail : hr@lesaffre.com',
  en: 'This question touches on a sensitive topic: please contact your HR team directly — they can answer confidentially.\n\nEmail: hr@lesaffre.com',
  es: 'Esta pregunta trata un tema sensible: le invitamos a contactar directamente a su equipo de RR. HH., que podrá responderle de forma confidencial.\n\nCorreo: hr@lesaffre.com',
};
const SENSITIVE_DATA_NOTICE: Record<string, string> = {
  fr: 'Votre message semble contenir des données personnelles sensibles. Pour votre sécurité, évitez de les partager ici.\n\n',
  en: 'Your message seems to contain sensitive personal data. For your safety, avoid sharing it here.\n\n',
  es: 'Su mensaje parece contener datos personales sensibles. Por su seguridad, evite compartirlos aquí.\n\n',
};

interface FlowHistoryEntry {
  role: 'user' | 'assistant';
  content: string;
}

// Matches "EID:<id>|" and "LANG:<code>|" prefixes the Power Apps code app's
// useChat.ts embeds in the message text (any order, either optional). The
// Power Automate flow this route is built for only has two trigger inputs
// (message, conversationHistory) — adding a third means re-editing that
// flow's designer by hand again, which was the single most time-consuming
// part of wiring this up. Piggybacking both on the message string avoids
// that without changing the flow.
const PREFIX_RE = /^(EID|LANG):([\w-]+)\|/;

function extractPrefixes(message: string): { message: string; employeeId?: string; language?: string } {
  let rest = message;
  let employeeId: string | undefined;
  let language: string | undefined;
  let match: RegExpExecArray | null;
  while ((match = PREFIX_RE.exec(rest))) {
    if (match[1] === 'EID') employeeId = match[2];
    else language = match[2];
    rest = rest.slice(match[0].length);
  }
  return { message: rest, employeeId, language };
}

/** Power Automate's "message" input is one string — accept plain text or a JSON-stringified history array. */
function parseHistory(raw: unknown): FlowHistoryEntry[] {
  if (Array.isArray(raw)) return raw as FlowHistoryEntry[];
  if (typeof raw === 'string' && raw.trim().length > 0) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function POST(request: NextRequest) {
  if (isRateLimitingEnabled()) {
    const limit = await checkChatRateLimit(getClientIp(request));
    if (!limit.allowed) {
      return errorResponse('RATE_LIMITED', 'Trop de requêtes. Réessayez dans une minute.', null, 429);
    }
  }

  if (!GEMINI_API_KEY) {
    console.error('[ai-chat-sync] GEMINI_API_KEY is not configured.');
    return errorResponse('CONFIG_ERROR', "Le service IA n'est pas configuré (GEMINI_API_KEY manquante).", null, 500);
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return errorResponse('BAD_REQUEST', 'Request body must be valid JSON.', null, 400);
  }

  const { conversationHistory: rawHistory, message: rawMessage, ...rest } = (rawBody ?? {}) as Record<string, unknown>;
  const { message, employeeId: embeddedEmployeeId, language: embeddedLanguage } = extractPrefixes(
    typeof rawMessage === 'string' ? rawMessage : ''
  );
  const validation = validateChatInput({
    ...rest,
    message,
    employeeId: embeddedEmployeeId ?? rest.employeeId,
    language: embeddedLanguage ?? rest.language,
    conversationHistory: parseHistory(rawHistory),
  });
  if (!validation.ok) {
    return errorResponse(validation.code, validation.message, null, 400);
  }
  const input = validation.value;
  const lang = input.language && input.language in ESCALATION_REPLY ? input.language : 'fr';

  try {
    const context = await buildContextData(input.employeeId, 'demo', input.language);
    const systemPrompt = buildSystemPrompt(context);

    const escalation = checkEscalation(input.message);
    const sensitiveTypes = detectSensitiveData(input.message);

    const meta = {
      mode: context.mode,
      escalated: escalation.escalate,
      escalationReason: escalation.reason ?? null,
      sensitiveDataDetected: sensitiveTypes.length > 0,
      model: GEMINI_MODEL,
    };
    console.info('[ai-chat-sync]', buildSafeLogMeta(input, meta));

    if (escalation.escalate) {
      return successResponse({ reply: ESCALATION_REPLY[lang], meta });
    }

    const contents = [
      ...input.conversationHistory.map((entry) => ({
        role: entry.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: entry.content }],
      })),
      { role: 'user', parts: [{ text: input.message }] },
    ];

    const geminiRes = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 1024, temperature: 0.7, thinkingConfig: { thinkingBudget: 0 } },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text().catch(() => '');
      console.error('[ai-chat-sync] Gemini error:', geminiRes.status, errText.slice(0, 500));
      return errorResponse('AI_UNAVAILABLE', 'Le service IA est momentanément indisponible.', null, 502);
    }

    const data = await geminiRes.json();
    const parts = data?.candidates?.[0]?.content?.parts;
    const text = Array.isArray(parts) ? parts.map((p: { text?: string }) => p.text ?? '').join('') : '';
    const prefix = sensitiveTypes.length > 0 ? SENSITIVE_DATA_NOTICE[lang] : '';

    return successResponse({
      reply: prefix + (text || 'Désolé, je n’ai pas pu générer de réponse. Réessayez.'),
      meta: { ...meta, tokensUsed: data?.usageMetadata?.totalTokenCount },
    });
  } catch (error) {
    console.error('[ai-chat-sync] failed:', error instanceof Error ? error.message : 'unknown');
    return errorResponse('INTERNAL_ERROR', 'L’assistant est temporairement indisponible.', null, 500);
  }
}
