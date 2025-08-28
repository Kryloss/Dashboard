import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: __dirname,

  // Subdomain routing is handled by middleware.ts

  // Configure allowed hostnames for development
  experimental: {
    allowedRevalidateHeaderKeys: ['x-vercel-revalidate'],
  },
};

export default nextConfig;
