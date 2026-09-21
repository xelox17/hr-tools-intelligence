"use client";

import { AccessGate } from "@/components/auth/AccessGate";
import AdminSettingsPage from "@/app/dashboard/admin/settings/page";

// The real admin settings (security, rate limits, CORS, webhooks) live in the
// original page; this route puts them behind the ADMIN role gate.
export default function SettingsPage() {
  return (
    <AccessGate page="SETTINGS">
      <AdminSettingsPage />
    </AccessGate>
  );
}
