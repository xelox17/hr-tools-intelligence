import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // uuid and jose ship pure ESM in node_modules; next/jest reads this
  // list to decide which node_modules packages it transforms for tests.
  transpilePackages: ["uuid", "jose"],
};

export default nextConfig;
