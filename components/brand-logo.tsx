import Image from "next/image";
import { LESAFFRE_THEME } from "@/lib/config/branding";
import { cn } from "@/lib/utils";

const { logo } = LESAFFRE_THEME;

/**
 * The Lesaffre logo file is a square PNG on a white background with generous
 * padding. It is cropped to a 3:2 frame (the mark and wordmark sit in the
 * vertical middle) and kept on white in dark mode, so it never needs a
 * transparent variant. Size it with `className` (e.g. "w-28").
 */
export function BrandLogo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <div className={cn("relative aspect-[3/2] w-28 shrink-0 overflow-hidden rounded-lg bg-white", className)}>
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
