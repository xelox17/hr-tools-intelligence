import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bot, Maximize2, Minimize2, MessageCircle, X } from "lucide-react";
import { ChatComponent } from "@/components/ChatComponent";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

// The full-page assistant has its own ChatComponent; a second useChat
// instance on the same page would not see the first one's in-memory state.
const FULL_PAGE_ROUTE = "/ai-assistant";
const PANEL_ID = "floating-chat-panel";

export function FloatingChatWidget() {
  const { pathname } = useLocation();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (pathname === FULL_PAGE_ROUTE) return null;

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      {/* Stays mounted while closed so an in-flight stream is not aborted. */}
      <section
        id={PANEL_ID}
        aria-label={t("widget.title")}
        hidden={!isOpen}
        className={cn(
          "pointer-events-auto flex flex-col overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-foreground/10",
          "w-[calc(100vw-2rem)] h-[min(32rem,calc(100dvh-7rem))]",
          isExpanded ? "sm:w-[32rem] sm:h-[min(44rem,calc(100dvh-7rem))]" : "sm:w-96"
        )}
      >
        <header className="flex items-center justify-between gap-2 border-b border-border bg-primary px-3 py-2 text-primary-foreground">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Bot className="h-4 w-4" />
            {t("widget.title")}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              className="hidden text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground sm:inline-flex"
              onClick={() => setIsExpanded((value) => !value)}
              aria-label={isExpanded ? t("widget.collapse") : t("widget.expand")}
            >
              {isExpanded ? <Minimize2 /> : <Maximize2 />}
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
              onClick={() => setIsOpen(false)}
              aria-label={t("widget.close")}
            >
              <X />
            </Button>
          </div>
        </header>
        <ChatComponent className="h-auto max-h-none min-h-0 flex-1 rounded-none ring-0" />
      </section>

      <Button
        size="icon-lg"
        className="pointer-events-auto size-12 rounded-full shadow-lg"
        onClick={() => setIsOpen((value) => !value)}
        aria-label={isOpen ? t("widget.closeNamed") : t("widget.open")}
        aria-expanded={isOpen}
        aria-controls={PANEL_ID}
      >
        {isOpen ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </Button>
    </div>
  );
}

export default FloatingChatWidget;
