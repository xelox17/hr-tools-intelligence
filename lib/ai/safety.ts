/**
 * Safety layer for the HR chatbot: input validation, rate limiting,
 * sensitive-data (GDPR) detection, automatic escalation and log-safe
 * metadata. No PII ever leaves this module in a log-friendly shape.
 */

import { checkRateLimit, type RateLimitResult } from '@/middleware/rate-limit';

export const MAX_MESSAGE_LENGTH = 5000;
export const MAX_HISTORY_MESSAGES = 20;
export const CHAT_RATE_LIMIT = { limit: 10, windowMs: 60_000 } as const;

export type ChatRole = 'user' | 'assistant';

export interface ChatHistoryMessage {
  role: ChatRole;
  content: string;
}

export interface ValidatedChatInput {
  message: string;
  employeeId?: string;
  /** UI language code ("fr" | "en" | "es") sent by the client's language switcher — see lib/ai/context-builder.ts's LANGUAGE_LABELS. */
  language?: string;
  conversationHistory: ChatHistoryMessage[];
}

export type ValidationResult =
  | { ok: true; value: ValidatedChatInput }
  | { ok: false; code: string; message: string };

// Common prompt-injection phrasings (EN/FR). Best-effort screening only —
// the system prompt is the real defence, this just rejects the obvious.
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+|any\s+)?(previous|prior|above)\s+(instructions|prompts?)/i,
  /ignore[zr]?\s+(toutes?\s+)?(les\s+)?instructions\s+(précédentes|precedentes|ci-dessus)/i,
  /(reveal|show|print|repeat)\s+(your|the)\s+(system\s+)?(prompt|instructions)/i,
  /(révèle|montre|affiche|répète)\s+(ton|tes|le|les)\s+(system\s+)?(prompt|instructions)/i,
  /you\s+are\s+now\s+(?:a|an|in)\b/i,
  /<\/?\s*system\s*>/i,
];

const SENSITIVE_PATTERNS: { type: string; pattern: RegExp }[] = [
  { type: 'iban', pattern: /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}(?:\s?[A-Z0-9]{1,4})?\b/ },
  { type: 'credit-card', pattern: /\b(?:\d[ -]?){13,16}\b/ },
  { type: 'french-ssn', pattern: /\b[12]\s?\d{2}\s?(?:0[1-9]|1[0-2])\s?\d{2}\s?\d{3}\s?\d{3}(?:\s?\d{2})?\b/ },
  { type: 'email', pattern: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/ },
];

export interface EscalationRule {
  reason: string;
  keywords: RegExp;
}

const ESCALATION_RULES: EscalationRule[] = [
  {
    reason: 'disciplinary',
    keywords: /\b(licenci\w*|disciplin\w*|sanction\w*|rupture conventionnelle|dismiss\w*|terminat\w*)\b/i,
  },
  {
    reason: 'harassment',
    keywords: /\b(harc[èe]lement|discrimin\w*|harass\w*|lanceur d['’]alerte|whistleblow\w*)\b/i,
  },
  {
    reason: 'medical',
    keywords: /\b(m[ée]decin|maladie|arr[êe]t maladie|accident du travail|burn-?out|medical|sick leave)\b/i,
  },
  {
    reason: 'salary',
    keywords: /\b(salaire|augmentation|r[ée]mun[ée]ration|salary|raise)\b/i,
  },
  {
    reason: 'legal',
    keywords: /\b(avocat|prud'?hommes?|tribunal|lawyer|lawsuit)\b/i,
  },
];

export interface EscalationResult {
  escalate: boolean;
  reason?: string;
}

export function validateChatInput(body: unknown): ValidationResult {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, code: 'BAD_REQUEST', message: 'Request body must be a JSON object.' };
  }

  const { message, employeeId, language, conversationHistory } = body as Record<string, unknown>;

  if (typeof message !== 'string' || message.trim().length === 0) {
    return { ok: false, code: 'BAD_REQUEST', message: 'A non-empty "message" is required.' };
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return {
      ok: false,
      code: 'MESSAGE_TOO_LONG',
      message: `Message exceeds ${MAX_MESSAGE_LENGTH} characters.`,
    };
  }
  if (INJECTION_PATTERNS.some((pattern) => pattern.test(message))) {
    return { ok: false, code: 'UNSAFE_INPUT', message: 'Message rejected by the safety filter.' };
  }
  if (employeeId !== undefined && typeof employeeId !== 'string') {
    return { ok: false, code: 'BAD_REQUEST', message: '"employeeId" must be a string.' };
  }
  if (language !== undefined && typeof language !== 'string') {
    return { ok: false, code: 'BAD_REQUEST', message: '"language" must be a string.' };
  }

  let history: ChatHistoryMessage[] = [];
  if (conversationHistory !== undefined) {
    if (!Array.isArray(conversationHistory)) {
      return { ok: false, code: 'BAD_REQUEST', message: '"conversationHistory" must be an array.' };
    }
    for (const entry of conversationHistory) {
      const candidate = entry as Partial<ChatHistoryMessage> | null;
      const validRole = candidate?.role === 'user' || candidate?.role === 'assistant';
      if (!candidate || !validRole || typeof candidate.content !== 'string') {
        return { ok: false, code: 'BAD_REQUEST', message: 'Invalid entry in "conversationHistory".' };
      }
      if (candidate.content.length > MAX_MESSAGE_LENGTH) {
        return { ok: false, code: 'MESSAGE_TOO_LONG', message: 'A history entry is too long.' };
      }
    }
    history = (conversationHistory as ChatHistoryMessage[])
      .slice(-MAX_HISTORY_MESSAGES)
      .map(({ role, content }) => ({ role, content }));
  }

  return {
    ok: true,
    value: {
      message: message.trim(),
      employeeId,
      language: typeof language === 'string' ? language : undefined,
      conversationHistory: history,
    },
  };
}

export function checkChatRateLimit(clientKey: string): Promise<RateLimitResult> {
  return checkRateLimit(`ai-chat:${clientKey}`, CHAT_RATE_LIMIT);
}

/** Returns the types of sensitive data found (never the values). */
export function detectSensitiveData(text: string): string[] {
  return SENSITIVE_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(({ type }) => type);
}

export function checkEscalation(text: string): EscalationResult {
  const rule = ESCALATION_RULES.find(({ keywords }) => keywords.test(text));
  return rule ? { escalate: true, reason: rule.reason } : { escalate: false };
}

/** Metadata safe to log: sizes and categories only, never message content. */
export function buildSafeLogMeta(input: ValidatedChatInput, extra: Record<string, unknown> = {}) {
  return {
    messageLength: input.message.length,
    historyLength: input.conversationHistory.length,
    hasEmployeeId: Boolean(input.employeeId),
    sensitiveTypes: detectSensitiveData(input.message),
    ...extra,
  };
}
