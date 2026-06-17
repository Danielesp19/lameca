import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Proxy API calls to Laravel
      {
        source: "/api-menu/:path*",
        destination: "http://localhost:8001/api/:path*",
      },
      // Proxy storage files to Laravel (avoids PHP single-thread bottleneck with Next.js image optimizer)
      {
        source: "/menu-storage/:path*",
        destination: "http://localhost:8001/storage/:path*",
      },
    ];
  },
  images: {
    // Images are proxied through Next.js rewrites → no external hostname needed
    remotePatterns: [],
    // Disable optimization: images load directly as <img> tags via the proxy
    unoptimized: true,
  },
};

export default nextConfig;
