"use client";

import { AccessGate } from "@/components/auth/AccessGate";
import ApiKeysPage from "@/app/dashboard/api-keys/page";

// The real API-key management (create / list / revoke against /api/keys) lives
// in the original page; this route puts it behind the ADMIN role gate.
export default function ApiKeysRoute() {
  return (
    <AccessGate page="API_KEYS">
      <ApiKeysPage />
    </AccessGate>
  );
}
