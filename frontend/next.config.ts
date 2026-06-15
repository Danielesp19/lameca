import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api-menu/:path*",
        destination: "http://localhost:8001/api/:path*",
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "8001" },
    ],
  },
};

export default nextConfig;
