import type { Metadata } from "next";
import HeroSection from "@/components/menu/HeroSection";
import MenuSection from "@/components/menu/MenuSection";
import CartRoot from "@/components/menu/CartRoot";
import SplashIntro from "@/components/menu/SplashIntro";
import SiteFooter from "@/components/menu/SiteFooter";
import { getMenu, getHero, type HeroSection as HeroData } from "@/lib/menu-api";

export const metadata: Metadata = {
  title: "Carta — La Meca",
  description: "Explora nuestra carta de cafés de origen, bebidas artesanales y repostería.",
};

// ISR: Vercel regenera esta página como máximo cada 60s y la sirve desde su CDN.
// Así 150 escaneos simultáneos se atienden desde el edge y el backend recibe ~1
// petición/minuto en vez de una por visita.
export const revalidate = 60;

export default async function MenuPage() {
  // Datos traídos en el servidor (cacheados por ISR). Si el backend falla, se pasa
  // un fallback "vacío/undefined" y los componentes cliente reintentan por su cuenta.
  const [categories, hero] = await Promise.all([
    getMenu().catch(() => [] as Awaited<ReturnType<typeof getMenu>>),
    getHero().then(h => h[0] ?? null).catch(() => undefined as HeroData | undefined),
  ]);

  return (
    <CartRoot>
    <main>
      {/* Splash de entrada: cubre la pantalla ~3.5s; el video del hero carga y
          se reproduce detrás y queda visible al levantarse el splash. */}
      <SplashIntro />
      <HeroSection initialHero={hero} />
      <MenuSection initialCategories={categories} />

      {/* Descarga de la carta en PDF — justo antes del pie de página */}
      <div style={{ display: "flex", justifyContent: "center", padding: "8px 22px 40px", background: "#F7F1E5" }}>
        <a
          href={`${process.env.NEXT_PUBLIC_MENU_API ?? "/api-menu"}/menu/pdf`}
          download="carta-la-meca.pdf"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "12px 22px", borderRadius: 999, textDecoration: "none",
            border: "1.5px solid rgba(62,42,28,0.25)", color: "#3E2A1C",
            fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Descargar carta (PDF)
        </a>
      </div>

      {/* Pie de página con dirección, contacto y redes (feedback del cliente) */}
      <SiteFooter />
    </main>
    </CartRoot>
  );
}
