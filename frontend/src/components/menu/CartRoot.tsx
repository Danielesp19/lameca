"use client";

import { ReactNode } from "react";
import { CartProvider } from "@/context/CartContext";
import { SedeProvider } from "@/context/SedeContext";
import FloatingCart from "./FloatingCart";
import SedeGate from "./SedeGate";
import WhatsAppButton from "./WhatsAppButton";

export default function CartRoot({ children }: { children: ReactNode }) {
  return (
    <SedeProvider>
    <CartProvider>
      {children}
      {/* Elegir sede: solo aparece si no llegó por el QR de un local ni hay
          una recordada (ver SedeContext). */}
      <SedeGate />
      {/* Modo QR → carrito; modo público → WhatsApp. Cada uno se auto-oculta.
          Instagram vive en el hero y en el footer — no flota con el scroll. */}
      <FloatingCart />
      <WhatsAppButton />
    </CartProvider>
    </SedeProvider>
  );
}
