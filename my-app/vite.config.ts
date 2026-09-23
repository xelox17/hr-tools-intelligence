import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { powerApps } from "@microsoft/power-apps-vite/plugin";

// https://vite.dev/config/
export default defineConfig({
  // Power Apps hosts the published app under a per-tenant/per-app subpath,
  // not the domain root — a relative base makes every emitted asset URL
  // (JS, CSS, imported images) resolve correctly there instead of 404ing
  // against the wrong root (this is what broke the bundled logo image).
  base: "./",
  plugins: [react(), powerApps()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
