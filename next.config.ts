import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // uuid and jose ship pure ESM in node_modules; next/jest reads this
  // list to decide which node_modules packages it transforms for tests.
  transpilePackages: ["uuid", "jose"],
  // The admin pages moved to top-level, role-gated routes; keep old links working.
  async redirects() {
    return [
      { source: "/dashboard/api-keys", destination: "/api-keys", permanent: false },
      { source: "/dashboard/audit", destination: "/audit-logs", permanent: false },
      { source: "/dashboard/admin/settings", destination: "/settings", permanent: false },
    ];
  },
};

export default nextConfig;
