import { useEffect, useRef, useState } from "react";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LANGUAGES } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

/** Small header dropdown to switch the UI (and the AI assistant's replies) between fr/en/es. */
export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("language.switcher.label")}
        aria-expanded={open}
        aria-haspopup="menu"
        className="gap-1"
      >
        <Languages className="h-4 w-4" />
        <span className="text-[10px] font-bold">{current.flag}</span>
      </Button>

      {open && (
        <div
          role="menu"
          className="animate-slide-down absolute right-0 z-50 mt-2 flex w-44 flex-col gap-0.5 rounded-xl bg-popover p-1.5 text-popover-foreground shadow-lg ring-1 ring-foreground/10"
        >
          {LANGUAGES.map((option) => (
            <button
              key={option.code}
              type="button"
              onClick={() => {
                setLanguage(option.code);
                setOpen(false);
              }}
              className={cn(
                "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-muted",
                option.code === language && "bg-muted font-semibold text-accent"
              )}
            >
              <span>{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.flag}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
