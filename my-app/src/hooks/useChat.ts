import { useCallback, useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAuth } from "@/lib/auth/hooks";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { PowerAppV2__Listerleslignes_Condition_R_ponse_R_ponse1Service as ChatFlow } from "@/generated";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  /** Set when the server flagged the question for a human HR contact. */
  escalated?: boolean;
}

export interface Conversation {
  id: string;
  /** Auto-derived from the first message; "Nouvelle conversation" until then. */
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

const CONVERSATIONS_KEY = "hr-chat-conversations";
const ACTIVE_ID_KEY = "hr-chat-active-conversation-id";
const MAX_CONVERSATIONS = 30;
const MAX_MESSAGES_PER_CONVERSATION = 100;
const HISTORY_SENT_TO_FLOW = 10;
const TITLE_MAX_CHARS = 42;

function createId(): string {
  return crypto.randomUUID();
}

function titleFromMessage(text: string): string {
  const flat = text.trim().replace(/\s+/g, " ");
  if (!flat) return "Nouvelle conversation";
  return flat.length > TITLE_MAX_CHARS ? `${flat.slice(0, TITLE_MAX_CHARS)}…` : flat;
}

function newConversation(): Conversation {
  return { id: createId(), title: "Nouvelle conversation", messages: [], updatedAt: Date.now() };
}

/**
 * Calls the HR chatbot through a Power Automate cloud flow instead of a
 * direct fetch() to the Vercel API — see the extensive comment this hook
 * used to carry (git history) for why. Conversations are multi-session
 * (like any generative AI chat UI): each has its own message list, stored
 * as a list in localStorage rather than one flat history, with a
 * `startNewConversation`/`switchConversation`/`deleteConversation` API for
 * the History dropdown in ChatComponent.tsx.
 */
export function useChat() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [conversations, setConversations, hydrated] = useLocalStorage<Conversation[]>(CONVERSATIONS_KEY, []);
  const [activeId, setActiveId] = useLocalStorage<string | null>(ACTIVE_ID_KEY, null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const messages = active?.messages ?? [];

  /** Returns the active conversation, creating one first if none exists yet. */
  const ensureActiveConversation = useCallback((): Conversation => {
    if (active) return active;
    const fresh = newConversation();
    setConversations((prev) => [fresh, ...prev].slice(0, MAX_CONVERSATIONS));
    setActiveId(fresh.id);
    return fresh;
  }, [active, setConversations, setActiveId]);

  const sendMessage = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || isLoading || !hydrated) return;

      const conv = ensureActiveConversation();
      const isFirstMessage = conv.messages.length === 0;
      const conversationHistory = conv.messages
        .filter((message) => message.content)
        .slice(-HISTORY_SENT_TO_FLOW)
        .map(({ role, content: body }) => ({ role, content: body }));

      const userMessage: ChatMessage = { id: createId(), role: "user", content, createdAt: Date.now() };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conv.id
            ? {
                ...c,
                messages: [...c.messages, userMessage].slice(-MAX_MESSAGES_PER_CONVERSATION),
                title: isFirstMessage ? titleFromMessage(content) : c.title,
                updatedAt: Date.now(),
              }
            : c
        )
      );
      setError(null);
      setIsLoading(true);

      try {
        // The registered flow's trigger only has two inputs (message,
        // conversationHistory) — the signed-in demo account's id and the
        // UI's selected language both ride along as prefixes the backend
        // strips (see chat-sync/route.ts's extractPrefixes), so the
        // assistant addresses the actual logged-in account in the language
        // the user is currently browsing in, instead of always defaulting
        // to a generic French persona.
        const messageForFlow = `${user ? `EID:${user.id}|` : ""}LANG:${language}|${content}`;
        const result = await ChatFlow.Run({
          text: messageForFlow,
          text_1: JSON.stringify(conversationHistory),
        });

        if (!result.success || !result.data?.reply) {
          const message = result.error instanceof Error ? result.error.message : "Le flow n'a renvoyé aucune réponse.";
          throw new Error(message);
        }

        const assistantMessage: ChatMessage = {
          id: createId(),
          role: "assistant",
          content: result.data.reply,
          createdAt: Date.now(),
        };
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conv.id
              ? { ...c, messages: [...c.messages, assistantMessage].slice(-MAX_MESSAGES_PER_CONVERSATION), updatedAt: Date.now() }
              : c
          )
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      } finally {
        setIsLoading(false);
      }
    },
    [ensureActiveConversation, hydrated, isLoading, setConversations, user]
  );

  // No in-flight request to cancel (the flow call isn't cancellable once
  // started) — this just resets the UI's loading state.
  const cancelMessage = useCallback(() => {
    setIsLoading(false);
  }, []);

  /** Clears the *active* conversation's messages (keeps it, empties it). */
  const clearHistory = useCallback(() => {
    setIsLoading(false);
    setError(null);
    if (!active) return;
    setConversations((prev) => prev.map((c) => (c.id === active.id ? { ...c, messages: [], title: "Nouvelle conversation" } : c)));
  }, [active, setConversations]);

  const deleteMessage = useCallback(
    (id: string) => {
      if (!active) return;
      setConversations((prev) => prev.map((c) => (c.id === active.id ? { ...c, messages: c.messages.filter((m) => m.id !== id) } : c)));
    },
    [active, setConversations]
  );

  const startNewConversation = useCallback(() => {
    const fresh = newConversation();
    setConversations((prev) => [fresh, ...prev].slice(0, MAX_CONVERSATIONS));
    setActiveId(fresh.id);
    setError(null);
  }, [setConversations, setActiveId]);

  const switchConversation = useCallback(
    (id: string) => {
      setActiveId(id);
      setError(null);
    },
    [setActiveId]
  );

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== id);
        if (id === activeId) setActiveId(next[0]?.id ?? null);
        return next;
      });
    },
    [activeId, setActiveId, setConversations]
  );

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    cancelMessage,
    clearHistory,
    deleteMessage,
    // Conversation history (newest first for the dropdown).
    conversations: [...conversations].sort((a, b) => b.updatedAt - a.updatedAt),
    activeConversationId: active?.id ?? null,
    startNewConversation,
    switchConversation,
    deleteConversation,
  };
}
