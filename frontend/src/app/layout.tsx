import type { Metadata } from "next";
import { Jost, Cormorant_Garamond, Playfair_Display } from "next/font/google";
import "./globals.css";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

// Fuente display para nombres de producto y títulos: más contraste y presencia
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "La Meca — Carta",
  description: "Descubre nuestra carta de cafés, bebidas y repostería artesanal.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${jost.variable} ${cormorant.variable} ${playfair.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
