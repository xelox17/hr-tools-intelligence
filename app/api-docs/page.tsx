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

      <div className="-mx-4 -my-6 flex min-h-[calc(100vh-3rem)] flex-col sm:-mx-6 md:-mx-8 md:-my-8">
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
