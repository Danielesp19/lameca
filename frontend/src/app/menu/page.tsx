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
      {/* Pie de página con dirección, contacto y redes (feedback del cliente) */}
      <SiteFooter />
    </main>
    </CartRoot>
  );
}
