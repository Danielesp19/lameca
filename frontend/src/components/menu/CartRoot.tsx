"use client";

import { ReactNode } from "react";
import { CartProvider } from "@/context/CartContext";
import FloatingCart from "./FloatingCart";
import WhatsAppButton from "./WhatsAppButton";

export default function CartRoot({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      {children}
      {/* Modo QR → carrito; modo público → WhatsApp. Cada uno se auto-oculta.
          Instagram vive en el hero y en el footer — no flota con el scroll. */}
      <FloatingCart />
      <WhatsAppButton />
    </CartProvider>
  );
}
