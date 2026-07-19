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
  async headers() {
    return [
      // Cabeceras de seguridad para todo el sitio
      {
        source: "/:path*",
        headers: [
          // La página no puede ser embebida en iframes de otros sitios
          // (clickjacking sobre el panel admin o la carta).
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // El navegador no debe adivinar tipos MIME distintos al declarado.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // No filtrar la URL completa (tokens de mesa en /t/...) a sitios externos.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // El panel y la carta no necesitan APIs sensibles del navegador.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      // Imágenes/videos del menú: Laravel los guarda con nombre hasheado (una subida
      // nueva = URL nueva), por lo que es seguro cachearlos por mucho tiempo. Esto
      // hace que el CDN de Vercel y el navegador sirvan los archivos sin pegar al
      // PHP single-thread del backend en cada escaneo.
      {
        source: "/menu-storage/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
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
