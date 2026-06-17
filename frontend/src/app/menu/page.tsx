import type { Metadata } from "next";
import HeroSection from "@/components/menu/HeroSection";
import MenuSection from "@/components/menu/MenuSection";

export const metadata: Metadata = {
  title: "Carta — La Meca",
  description: "Explora nuestra carta de cafés de origen, bebidas artesanales y repostería.",
};

export default function MenuPage() {
  return (
    <main>
      <HeroSection />
      <MenuSection />
      <footer style={{
        background: "#F2ECE1",
        padding: "clamp(32px,4vw,56px) clamp(20px,5vw,68px)",
        textAlign: "center",
        fontSize: 11,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "rgba(36,26,18,0.45)",
        borderTop: "1px solid rgba(36,26,18,0.08)",
        fontFamily: "var(--font-sans)",
      }}>
        © {new Date().getFullYear()} La Meca · Todos los derechos reservados
      </footer>
    </main>
  );
}
