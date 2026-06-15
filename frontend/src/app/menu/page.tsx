export const dynamic = "force-dynamic";

import { getMenu, getHero } from "@/lib/menu-api";
import HeroSection from "@/components/menu/HeroSection";
import MenuGrid from "@/components/menu/MenuGrid";

export const metadata = {
  title: "Carta — Coffee Club",
  description: "Explora nuestra carta de cafés de origen, bebidas artesanales y repostería.",
};

export default async function MenuPage() {
  const [categories, heroes] = await Promise.all([
    getMenu().catch(() => []),
    getHero().catch(() => []),
  ]);

  const hero = heroes[0] ?? null;

  return (
    <main>
      <HeroSection hero={hero} />
      <MenuGrid categories={categories} />

      {/* Footer */}
      <footer
        className="py-12 text-center text-xs tracking-widest uppercase"
        style={{
          color: "#3B1F0A",
          borderTop: "1px solid rgba(200,169,126,0.08)",
        }}
      >
        © {new Date().getFullYear()} Coffee Club · Todos los derechos reservados
      </footer>
    </main>
  );
}
