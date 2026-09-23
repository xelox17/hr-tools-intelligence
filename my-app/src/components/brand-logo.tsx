import { LESAFFRE_THEME } from "@/lib/config/branding";
import { cn } from "@/lib/utils";

const { logo } = LESAFFRE_THEME;

/**
 * The source PNG has a real transparent background (verified against the
 * Next.js app's copy) — the white behind it in light mode comes entirely
 * from the tile below, not from the file. Light mode: opaque white tile with
 * a ring/shadow (a framed chip). Dark mode: tile chrome switched off via
 * `dark:`, so the sidebar's own dark surface shows through. Size with
 * `className` (e.g. "w-28").
 */
export function BrandLogo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <div
      className={cn(
        "relative aspect-[3/2] w-28 shrink-0 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-foreground/10 dark:bg-transparent dark:shadow-none dark:ring-0",
        className
      )}
    >
      <img
        src={logo.src}
        alt={logo.alt}
        width={logo.width}
        height={logo.height}
        loading={priority ? "eager" : "lazy"}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}
