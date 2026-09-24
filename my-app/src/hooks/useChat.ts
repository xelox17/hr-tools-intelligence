import { useCallback, useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
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

const STORAGE_KEY = "hr-chat-history";
const MAX_STORED_MESSAGES = 100;
const HISTORY_SENT_TO_FLOW = 10;

function createId(): string {
  return crypto.randomUUID();
}

/**
 * Calls the HR chatbot through a Power Automate cloud flow instead of a
 * direct fetch() to the Vercel API. The *published* Power Apps player
 * sandboxes fetch() to an external origin (confirmed: login and the chat
 * both failed with "Failed to fetch" there, even though both worked fine
 * in a plain browser tab) — a registered cloud flow is the supported way
 * for a code app to reach outside Power Platform. The flow itself just
 * forwards to POST /api/ai/chat-sync (see that route's comment) and
 * returns one `reply` string — no token-by-token streaming, since neither
 * the flow's "Respond to a PowerApp or flow" action nor the generated
 * data-source client support it. The UI fills in the full reply at once
 * instead of word by word.
 */
export function useChat() {
  const [messages, setMessages, hydrated] = useLocalStorage<ChatMessage[]>(STORAGE_KEY, []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || isLoading || !hydrated) return;

      const conversationHistory = messages
        .filter((message) => message.content)
        .slice(-HISTORY_SENT_TO_FLOW)
        .map(({ role, content: body }) => ({ role, content: body }));

      const userMessage: ChatMessage = { id: createId(), role: "user", content, createdAt: Date.now() };
      setMessages((prev) => [...prev, userMessage].slice(-MAX_STORED_MESSAGES));
      setError(null);
      setIsLoading(true);

      try {
        const result = await ChatFlow.Run({
          text: content,
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
        setMessages((prev) => [...prev, assistantMessage].slice(-MAX_STORED_MESSAGES));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      } finally {
        setIsLoading(false);
      }
    },
    [hydrated, isLoading, messages, setMessages]
  );

  // No in-flight request to cancel (the flow call isn't cancellable once
  // started) — this just resets the UI's loading state.
  const cancelMessage = useCallback(() => {
    setIsLoading(false);
  }, []);

  const clearHistory = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setMessages([]);
  }, [setMessages]);

  const deleteMessage = useCallback(
    (id: string) => {
      setMessages((prev) => prev.filter((message) => message.id !== id));
    },
    [setMessages]
  );

  return { messages, isLoading, error, sendMessage, cancelMessage, clearHistory, deleteMessage };
}
