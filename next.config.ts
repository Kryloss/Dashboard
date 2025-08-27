import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: __dirname,

  // Handle subdomain routing
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/healss',
        has: [
          {
            type: 'host',
            value: 'healss.localhost:3001',
          },
        ],
      },
      {
        source: '/:path*',
        destination: '/healss/:path*',
        has: [
          {
            type: 'host',
            value: 'healss.localhost:3001',
          },
        ],
      },
      {
        source: '/',
        destination: '/healss',
        has: [
          {
            type: 'host',
            value: 'healss.kryloss.com',
          },
        ],
      },
      {
        source: '/:path*',
        destination: '/healss/:path*',
        has: [
          {
            type: 'host',
            value: 'healss.kryloss.com',
          },
        ],
      },
    ];
  },

  // Configure allowed hostnames for development
  experimental: {
    allowedRevalidateHeaderKeys: ['x-vercel-revalidate'],
  },
};

export default nextConfig;
