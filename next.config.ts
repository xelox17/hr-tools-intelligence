import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // uuid and jose ship pure ESM in node_modules; next/jest reads this
  // list to decide which node_modules packages it transforms for tests.
  transpilePackages: ["uuid", "jose"],
  // These pages moved to top-level routes; keep the old links working.
  async redirects() {
    return [
      { source: "/dashboard/api-keys", destination: "/api-keys", permanent: false },
      { source: "/dashboard/audit", destination: "/audit-logs", permanent: false },
      { source: "/dashboard/admin/settings", destination: "/settings", permanent: false },
      { source: "/dashboard/ai-assistant", destination: "/ai-assistant", permanent: false },
      { source: "/dashboard/exports", destination: "/exports", permanent: false },
    ];
  },
};

export default nextConfig;
