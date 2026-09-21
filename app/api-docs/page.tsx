"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import {
  SWAGGER_UI_CDN,
  initSwaggerUI,
  applySwaggerDarkTheme,
  removeSwaggerDarkTheme,
} from "@/lib/swagger-ui-config";

export default function ApiDocsPage() {
  const [bundleLoaded, setBundleLoaded] = useState(false);
  const [presetLoaded, setPresetLoaded] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const initialized = useRef(false);

  useEffect(() => {
    if (bundleLoaded && presetLoaded && !initialized.current) {
      initSwaggerUI(window);
      initialized.current = true;
    }
  }, [bundleLoaded, presetLoaded]);

  useEffect(() => {
    if (theme === "dark") applySwaggerDarkTheme();
    else removeSwaggerDarkTheme();
  }, [theme]);

  return (
    <>
      <link rel="stylesheet" href={SWAGGER_UI_CDN.css} />
      <Script src={SWAGGER_UI_CDN.bundleJs} strategy="afterInteractive" onLoad={() => setBundleLoaded(true)} />
      <Script src={SWAGGER_UI_CDN.presetJs} strategy="afterInteractive" onLoad={() => setPresetLoaded(true)} />

      {/* Full-bleed: cancels the padding of the app shell (px-4 sm:px-6 lg:px-8, pt-5 sm:pt-6 lg:pt-8, pb-24). */}
      <div className="-mx-4 -mt-5 -mb-24 flex min-h-[calc(100dvh-3.5rem)] flex-col sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8">
        <header className="flex flex-col gap-2 border-b border-border bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 md:px-8">
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground">Lesaffre HR Backend API</h1>
            <p className="text-sm text-muted-foreground">
              Interactive OpenAPI 3.0 documentation — spec served from{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">/api/swagger</code>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
            className="self-start rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            {theme === "light" ? "Dark mode" : "Light mode"}
          </button>
        </header>
        <div id="swagger-ui" className="flex-1 bg-white" />
      </div>
    </>
  );
}
