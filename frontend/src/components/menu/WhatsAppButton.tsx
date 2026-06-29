"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { getSedes } from "@/lib/orders-api";
import type { SedeInfo } from "@/lib/table-session";

const GREEN = "#25D366";
const DARK = "#241a12";
const CREAM = "#F2ECE1";

const MESSAGE = "¡Hola! Vi la carta de La Meca y quisiera hacer un pedido 🧉";

function waLink(phone: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(MESSAGE)}`;
}

export default function WhatsAppButton() {
  const { hasSession } = useCart();
  const [sedes, setSedes] = useState<SedeInfo[]>([]);
  const [pick, setPick] = useState(false);

  useEffect(() => {
    getSedes().then(list => setSedes(list.filter(s => s.whatsapp_phone)));
  }, []);

  // Se muestra siempre que NO haya una sesión de QR válida (público o caducada),
  // y si hay al menos un número de WhatsApp configurado.
  if (hasSession || sedes.length === 0) return null;

  function go(sede: SedeInfo) {
    if (sede.whatsapp_phone) window.open(waLink(sede.whatsapp_phone), "_blank", "noopener");
    setPick(false);
  }

  function onClick() {
    if (sedes.length === 1) go(sedes[0]);
    else setPick(true);
  }

  return (
    <>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={onClick}
        style={{
          position: "fixed", bottom: 22, right: 22, zIndex: 150,
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 20px", borderRadius: 999, border: "none", cursor: "pointer",
          background: GREEN, color: "#FFFFFF",
          boxShadow: "0 12px 36px rgba(10,6,4,0.4)",
          fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600,
        }}
        aria-label="Pedir por WhatsApp"
      >
        <span style={{ fontSize: 20 }}>💬</span>
        Pedir por WhatsApp
      </motion.button>

      {/* Selector de sede (si hay más de una con WhatsApp) */}
      <AnimatePresence>
        {pick && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setPick(false)}
              style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,6,4,0.7)", backdropFilter: "blur(6px)" }}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 36 }}
              style={{
                position: "fixed", zIndex: 201, bottom: 0, left: 0, right: 0,
                maxWidth: 460, margin: "0 auto",
                background: CREAM, borderRadius: "24px 24px 0 0",
                padding: "22px 22px 28px", fontFamily: "var(--font-sans)", color: DARK,
                boxShadow: "0 -20px 60px rgba(10,6,4,0.5)",
              }}
            >
              <span style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", width: 42, height: 5, borderRadius: 3, background: "rgba(36,26,18,0.2)" }} />
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 22, margin: "6px 0 4px" }}>¿A cuál sede?</h2>
              <p style={{ fontSize: 13, opacity: 0.65, margin: "0 0 16px" }}>Elige el local con el que quieres coordinar tu pedido.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {sedes.map(s => (
                  <button
                    key={s.id}
                    onClick={() => go(s)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                      padding: "14px 16px", borderRadius: 14, cursor: "pointer",
                      border: "1px solid rgba(36,26,18,0.14)", background: "#FFFDF9", color: DARK,
                      fontSize: 14.5, fontWeight: 600, textAlign: "left",
                    }}
                  >
                    <span>
                      {s.name}
                      {s.address && <span style={{ display: "block", fontSize: 12, fontWeight: 400, opacity: 0.6, marginTop: 2 }}>{s.address}</span>}
                    </span>
                    <span style={{ fontSize: 18 }}>💬</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
