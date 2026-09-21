"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  /** Set when the server flagged the question for a human HR contact. */
  escalated?: boolean;
}

interface StreamEvent {
  type: "text" | "done" | "error";
  text?: string;
  message?: string;
  meta?: { escalated?: boolean };
}

const STORAGE_KEY = "hr-chat-history";
const MAX_STORED_MESSAGES = 100;
const HISTORY_SENT_TO_API = 10;
const CHAT_ENDPOINT = "/api/ai/chat";

function createId(): string {
  return crypto.randomUUID();
}

/** Parses one SSE block ("data: {...}") into an event, ignoring anything else. */
function parseEvent(block: string): StreamEvent | null {
  const dataLine = block.split("\n").find((line) => line.startsWith("data: "));
  if (!dataLine) return null;
  try {
    return JSON.parse(dataLine.slice("data: ".length)) as StreamEvent;
  } catch {
    return null;
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return body?.error?.message ?? `Erreur ${response.status}`;
  } catch {
    return `Erreur ${response.status}`;
  }
}

export function useChat() {
  const [messages, setMessages, hydrated] = useLocalStorage<ChatMessage[]>(STORAGE_KEY, []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const updateMessage = useCallback(
    (id: string, patch: (message: ChatMessage) => ChatMessage) => {
      setMessages((prev) => prev.map((message) => (message.id === id ? patch(message) : message)));
    },
    [setMessages]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || isLoading || !hydrated) return;

      const conversationHistory = messages
        .filter((message) => message.content)
        .slice(-HISTORY_SENT_TO_API)
        .map(({ role, content: body }) => ({ role, content: body }));

      const userMessage: ChatMessage = { id: createId(), role: "user", content, createdAt: Date.now() };
      const assistantMessage: ChatMessage = {
        id: createId(),
        role: "assistant",
        content: "",
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage].slice(-MAX_STORED_MESSAGES));
      setError(null);
      setIsLoading(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(CHAT_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content, conversationHistory }),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(await readErrorMessage(response));
        if (!response.body) throw new Error("Réponse vide du serveur.");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split("\n\n");
          buffer = blocks.pop() ?? "";

          for (const block of blocks) {
            const event = parseEvent(block);
            if (!event) continue;

            if (event.type === "text" && event.text) {
              const chunk = event.text;
              updateMessage(assistantMessage.id, (m) => ({ ...m, content: m.content + chunk }));
            } else if (event.type === "done" && event.meta?.escalated) {
              updateMessage(assistantMessage.id, (m) => ({ ...m, escalated: true }));
            } else if (event.type === "error") {
              throw new Error(event.message ?? "Erreur de streaming.");
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
        // Drop the placeholder if nothing was streamed before the failure.
        setMessages((prev) => prev.filter((m) => m.id !== assistantMessage.id || m.content));
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setIsLoading(false);
      }
    },
    [hydrated, isLoading, messages, setMessages, updateMessage]
  );

  const cancelMessage = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
    // Drop an assistant placeholder that never received any text.
    setMessages((prev) => prev.filter((m) => m.role !== "assistant" || m.content));
  }, [setMessages]);

  const clearHistory = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
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
