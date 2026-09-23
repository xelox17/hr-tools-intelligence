import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { AlertTriangle, Bot, Send, Square, Trash2, User, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useChat, type ChatMessage } from "@/hooks/useChat";
import { cn } from "@/lib/utils";

const QUICK_SUGGESTIONS = [
  { label: "Mes congés", prompt: "Combien de jours de congés ai-je et comment poser une demande ?" },
  { label: "Ma paie", prompt: "Où puis-je consulter mes bulletins de paie ?" },
  { label: "Télétravail", prompt: "Quelle est la politique de télétravail ?" },
  { label: "Outils RH", prompt: "Quels outils RH sont à ma disposition ?" },
];

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
            isStreaming && <span className="text-muted-foreground">Réflexion en cours…</span>
          )}
        </div>

        {message.escalated && (
          <Badge variant="warning" size="sm">
            <AlertTriangle />
            Contactez l'équipe RH
          </Badge>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon-xs"
        className="self-start opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        onClick={() => onDelete(message.id)}
        aria-label="Supprimer le message"
      >
        <X />
      </Button>
    </div>
  );
}

export function ChatComponent({ className }: { className?: string }) {
  const { messages, isLoading, error, sendMessage, cancelMessage, clearHistory, deleteMessage } = useChat();
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
              Mode démo
            </Badge>
            <span className="text-xs text-muted-foreground">Assistant RH Lesaffre</span>
          </div>
          <Button variant="ghost" size="xs" onClick={clearHistory} disabled={messages.length === 0}>
            <Trash2 />
            Effacer l'historique
          </Button>
        </div>

        <div
          ref={scrollRef}
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1"
          role="log"
          aria-live="polite"
          aria-label="Conversation"
        >
          {messages.length === 0 ? (
            <div className="m-auto flex max-w-sm flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary ring-1 ring-border">
                <Bot className="h-6 w-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                Bonjour ! Posez une question RH ou choisissez une suggestion.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_SUGGESTIONS.map((suggestion) => (
                  <Button
                    key={suggestion.label}
                    variant="outline"
                    size="sm"
                    onClick={() => submit(suggestion.prompt)}
                  >
                    {suggestion.label}
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
            placeholder="Votre question… (Entrée pour envoyer, Maj+Entrée pour un retour à la ligne)"
            aria-label="Votre message"
            className="min-h-10 flex-1 resize-none rounded-xl border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          />
          {isLoading ? (
            <Button type="button" variant="outline" size="icon-lg" onClick={cancelMessage} aria-label="Arrêter">
              <Square />
            </Button>
          ) : (
            <Button type="submit" size="icon-lg" disabled={!input.trim()} aria-label="Envoyer">
              <Send />
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

export default ChatComponent;
