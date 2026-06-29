import type { NextConfig } from "next";

// URL interna del backend Laravel. En local: localhost:8001.
// En producción se define BACKEND_URL (p.ej. https://api.lameca.co o la URL interna del contenedor).
const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8001";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Proxy API calls to Laravel
      {
        source: "/api-menu/:path*",
        destination: `${BACKEND}/api/:path*`,
      },
      // Proxy storage files to Laravel (avoids PHP single-thread bottleneck with Next.js image optimizer)
      {
        source: "/menu-storage/:path*",
        destination: `${BACKEND}/storage/:path*`,
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
