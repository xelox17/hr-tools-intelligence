import Image from "next/image";
import { LESAFFRE_THEME } from "@/lib/config/branding";
import { cn } from "@/lib/utils";

const { logo } = LESAFFRE_THEME;

/**
 * The source PNG already has a real transparent background (verified: its
 * alpha channel varies 0–255, only the mark + "LESAFFRE" wordmark are
 * opaque) — the white behind it in light mode comes entirely from the
 * `bg-white` tile below, not from the file. So:
 *
 * - Light mode: the tile is opaque white with a ring/shadow, framing the
 *   logo as a chip — unchanged from before.
 * - Dark mode: the tile's background/ring/shadow are switched off, so the
 *   sidebar's own dark surface shows through the logo's real transparency.
 *
 * Same file, same crop, same colours, same size in both modes — only the
 * tile chrome around it changes. Size with `className` (e.g. "w-28").
 */
export function BrandLogo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <div
      className={cn(
        "relative aspect-[3/2] w-28 shrink-0 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-foreground/10 dark:bg-transparent dark:shadow-none dark:ring-0",
        className
      )}
    >
      <Image
        src={logo.src}
        alt={logo.alt}
        width={logo.width}
        height={logo.height}
        sizes="160px"
        priority={priority}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}
