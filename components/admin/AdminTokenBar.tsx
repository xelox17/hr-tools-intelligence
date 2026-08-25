"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/alert";
import { useAdminToken } from "@/hooks/useAdminToken";

/**
 * Compact "paste your Bearer token" bar for pages behind proxy.ts's admin
 * auth gate. Interim UI until a real login page exists (see
 * docs/FRONTEND.md) — mint a token with `signJwt` from middleware/auth.ts
 * for local testing.
 */
export function AdminTokenBar() {
  const { token, setToken, hasToken } = useAdminToken();
  const [draft, setDraft] = useState(token);

  if (hasToken) return null;

  return (
    <InlineAlert
      type="warning"
      title="Admin token required"
      description={
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <KeyRound className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 opacity-60" />
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Paste a Bearer JWT (role: admin)"
              className="bg-white/70 pl-8 dark:bg-black/20"
            />
          </div>
          <Button size="sm" onClick={() => setToken(draft.trim())} disabled={!draft.trim()}>
            Save
          </Button>
        </div>
      }
    />
  );
}
