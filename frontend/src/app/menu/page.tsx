import type { Metadata } from "next";
import HeroSection from "@/components/menu/HeroSection";
import MenuSection from "@/components/menu/MenuSection";
import CartRoot from "@/components/menu/CartRoot";

export const metadata: Metadata = {
  title: "Carta — La Meca",
  description: "Explora nuestra carta de cafés de origen, bebidas artesanales y repostería.",
};

export default function MenuPage() {
  return (
    <CartRoot>
    <main>
      <HeroSection />
      <MenuSection />
      <footer style={{
        background: "#0A0A0A",
        padding: "clamp(32px,4vw,56px) clamp(20px,5vw,68px)",
        textAlign: "center",
        fontSize: 11,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "rgba(242,235,227,0.4)",
        borderTop: "1px solid rgba(242,235,227,0.08)",
        fontFamily: "var(--font-sans)",
      }}>
        © {new Date().getFullYear()} La Meca · Todos los derechos reservados
      </footer>
    </main>
    </CartRoot>
  );
}
