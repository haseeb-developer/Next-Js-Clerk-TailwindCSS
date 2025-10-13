import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Basic configuration for Clerk
  
  // Fix workspace root issue with Turbopack
  experimental: {
    turbo: {
      root: process.cwd(),
    },
  },
};

export default nextConfig;
