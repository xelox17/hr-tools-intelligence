import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { AlertTriangle, Bot, History, MessageSquarePlus, Send, Square, Trash2, User, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useChat, type ChatMessage, type Conversation } from "@/hooks/useChat";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

// Aligned with what the assistant actually knows well: the 23-tool HR
// catalog (Recruitment/Learning/Corporate/Payroll — see data/applications.ts),
// framed as "which tool do I use for X" rather than a process it can't
// actually run (it has no real leave balance or payroll data). Labels and
// prompts come from the translation dictionary so they follow the UI's
// selected language, and the prompt itself is sent to the assistant so it
// answers in kind.
const QUICK_SUGGESTION_KEYS = [
  { labelKey: "chat.suggestion.recruitment.label", promptKey: "chat.suggestion.recruitment.prompt" },
  { labelKey: "chat.suggestion.training.label", promptKey: "chat.suggestion.training.prompt" },
  { labelKey: "chat.suggestion.myHr.label", promptKey: "chat.suggestion.myHr.prompt" },
  { labelKey: "chat.suggestion.payroll.label", promptKey: "chat.suggestion.payroll.prompt" },
];

function relativeDate(timestamp: number, t: (key: string, vars?: Record<string, string | number>) => string): string {
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return t("chat.relative.now");
  if (diffMin < 60) return t("chat.relative.minutes", { n: diffMin });
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return t("chat.relative.hours", { n: diffH });
  const diffD = Math.round(diffH / 24);
  return t("chat.relative.days", { n: diffD });
}

function MessageBubble({
  message,
  isStreaming,
  onDelete,
}: {
  message: ChatMessage;
  isStreaming: boolean;
  onDelete: (id: string) => void;
}) {
  const isUser = message.role === "user";
  const { t } = useLanguage();

  return (
    <div className={cn("group flex gap-2.5", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-primary ring-1 ring-border"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className={cn("flex max-w-[85%] flex-col gap-1.5", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
            isUser
              ? "rounded-tr-sm bg-primary text-primary-foreground"
              : "rounded-tl-sm bg-secondary text-secondary-foreground ring-1 ring-border"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : message.content ? (
            <div className="break-words [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          ) : (
            isStreaming && <span className="text-muted-foreground">{t("chat.thinking")}</span>
          )}
        </div>

        {message.escalated && (
          <Badge variant="warning" size="sm">
            <AlertTriangle />
            {t("chat.escalated")}
          </Badge>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon-xs"
        className="self-start opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        onClick={() => onDelete(message.id)}
        aria-label={t("chat.deleteMessage")}
      >
        <X />
      </Button>
    </div>
  );
}

/** Dropdown listing past conversations, with "new conversation" at the top — like any generative AI chat UI. */
function HistoryMenu({
  conversations,
  activeId,
  onNew,
  onSelect,
  onDelete,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="xs"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("chat.history")}
      >
        <History />
        {t("chat.history")}
      </Button>

      {open && (
        <div
          role="menu"
          className="animate-slide-down absolute right-0 z-50 mt-2 flex max-h-96 w-72 max-w-[calc(100vw-2rem)] flex-col gap-1 overflow-y-auto rounded-xl bg-popover p-2 text-popover-foreground shadow-lg ring-1 ring-foreground/10"
        >
          <button
            type="button"
            onClick={() => {
              onNew();
              setOpen(false);
            }}
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium text-accent hover:bg-muted"
          >
            <MessageSquarePlus className="h-4 w-4" />
            {t("chat.newConversation")}
          </button>

          {conversations.length > 0 && <div role="separator" className="my-1 h-px shrink-0 bg-border" />}

          {conversations.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">{t("chat.noConversations")}</p>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "group flex items-center gap-1 rounded-lg px-1 py-1 text-sm",
                  conversation.id === activeId ? "bg-muted" : "hover:bg-muted"
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelect(conversation.id);
                    setOpen(false);
                  }}
                  className="flex min-w-0 flex-1 flex-col items-start gap-0.5 rounded-md px-1.5 py-1 text-left"
                >
                  <span className="w-full truncate font-medium text-foreground">{conversation.title}</span>
                  <span className="text-xs text-muted-foreground">{relativeDate(conversation.updatedAt, t)}</span>
                </button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  onClick={() => onDelete(conversation.id)}
                  aria-label={t("chat.deleteConversationNamed", { title: conversation.title })}
                >
                  <X />
                </Button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function ChatComponent({ className }: { className?: string }) {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    cancelMessage,
    clearHistory,
    deleteMessage,
    conversations,
    activeConversationId,
    startNewConversation,
    switchConversation,
    deleteConversation,
  } = useChat();
  const { t } = useLanguage();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, isLoading]);

  function submit(text: string) {
    if (!text.trim() || isLoading) return;
    setInput("");
    void sendMessage(text);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit(input);
    }
  }

  const lastMessageId = messages[messages.length - 1]?.id;

  return (
    <Card className={cn("h-[34rem] max-h-[75dvh] rounded-2xl", className)}>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="info" size="sm">
              {t("chat.demoMode")}
            </Badge>
            <span className="hidden text-xs text-muted-foreground sm:inline">{t("chat.assistantName")}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-xs" onClick={clearHistory} disabled={messages.length === 0} aria-label={t("chat.clearConversation")}>
              <Trash2 />
            </Button>
            <HistoryMenu
              conversations={conversations}
              activeId={activeConversationId}
              onNew={startNewConversation}
              onSelect={switchConversation}
              onDelete={deleteConversation}
            />
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1"
          role="log"
          aria-live="polite"
          aria-label={t("chat.conversationLog")}
        >
          {messages.length === 0 ? (
            <div className="m-auto flex max-w-sm flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary ring-1 ring-border">
                <Bot className="h-6 w-6" />
              </div>
              <p className="text-sm text-muted-foreground">{t("chat.emptyGreeting")}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_SUGGESTION_KEYS.map((suggestion) => (
                  <Button
                    key={suggestion.labelKey}
                    variant="outline"
                    size="sm"
                    onClick={() => submit(t(suggestion.promptKey))}
                  >
                    {t(suggestion.labelKey)}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isStreaming={isLoading && message.id === lastMessageId}
                onDelete={deleteMessage}
              />
            ))
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            submit(input);
          }}
        >
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            maxLength={5000}
            placeholder={t("chat.placeholder")}
            aria-label={t("chat.yourMessage")}
            className="min-h-10 flex-1 resize-none rounded-xl border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          />
          {isLoading ? (
            <Button type="button" variant="outline" size="icon-lg" onClick={cancelMessage} aria-label={t("chat.stop")}>
              <Square />
            </Button>
          ) : (
            <Button type="submit" size="icon-lg" disabled={!input.trim()} aria-label={t("chat.send")}>
              <Send />
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

export default ChatComponent;
