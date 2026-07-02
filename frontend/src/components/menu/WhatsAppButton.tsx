"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { getSedes } from "@/lib/orders-api";
import type { SedeInfo } from "@/lib/table-session";

// Paleta rediseño v2
const OLIVE = "#6E8B4E";
const DARK = "#3E2A1C";
const CREAM = "#F7F1E5";

const MESSAGE = "¡Hola! Vi la carta de La Meca y quisiera hacer un pedido 🧉";

// Número de respaldo (opcional, formato internacional sin +). Si ninguna sede
// tiene WhatsApp configurado y tampoco hay env, se abre el selector de contacto.
const FALLBACK_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "";

function waLink(phone: string): string {
  const text = encodeURIComponent(MESSAGE);
  return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
}

export default function WhatsAppButton() {
  const { hasSession } = useCart();
  const [sedes, setSedes] = useState<SedeInfo[]>([]);
  const [pick, setPick] = useState(false);

  useEffect(() => {
    getSedes().then(list => setSedes(list.filter(s => s.whatsapp_phone)));
  }, []);

  // Se muestra siempre que NO haya una sesión de QR válida (público o caducada).
  if (hasSession) return null;

  function go(sede: SedeInfo) {
    window.open(waLink(sede.whatsapp_phone ?? FALLBACK_PHONE), "_blank", "noopener");
    setPick(false);
  }

  function onClick() {
    if (sedes.length > 1) setPick(true);
    else if (sedes.length === 1) go(sedes[0]);
    else window.open(waLink(FALLBACK_PHONE), "_blank", "noopener");
  }

  return (
    <>
      {/* Botón flotante centrado — estilo del diseño (pill con anillo pulsante) */}
      <motion.button
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 26, delay: 0.6 }}
        onClick={onClick}
        style={{
          position: "fixed", bottom: 20, left: "50%", zIndex: 150,
          x: "-50%",
          display: "inline-flex", alignItems: "center", gap: 10,
          padding: "14px 28px", borderRadius: 999, border: "none", cursor: "pointer",
          background: OLIVE, color: "#FBF7EC",
          boxShadow: "0 16px 34px -12px rgba(110,139,78,0.65)",
          fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600,
          letterSpacing: "0.1em", textTransform: "uppercase",
        }}
        whileTap={{ scale: 0.96 }}
        aria-label="Pedir por WhatsApp"
      >
        <span aria-hidden="true" style={{
          position: "absolute", inset: 0, borderRadius: 999,
          border: "2px solid rgba(110,139,78,0.55)",
          animation: "pulseRing 2.2s ease-out infinite",
          pointerEvents: "none",
        }} />
        <span style={{ fontSize: 17 }}>💬</span>
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
              style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(46,30,18,0.6)", backdropFilter: "blur(6px)" }}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 36 }}
              style={{
                position: "fixed", zIndex: 201, bottom: 0, left: 0, right: 0,
                maxWidth: 460, margin: "0 auto",
                background: CREAM, borderRadius: "24px 24px 0 0",
                padding: "22px 22px 28px", fontFamily: "var(--font-sans)", color: DARK,
                boxShadow: "0 -20px 60px rgba(46,30,18,0.5)",
              }}
            >
              <span style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", width: 42, height: 5, borderRadius: 3, background: "rgba(62,42,28,0.2)" }} />
              <h2 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 22, margin: "6px 0 4px" }}>¿A cuál sede?</h2>
              <p style={{ fontSize: 13, opacity: 0.65, margin: "0 0 16px" }}>Elige el local con el que quieres coordinar tu pedido.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {sedes.map(s => (
                  <button
                    key={s.id}
                    onClick={() => go(s)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                      padding: "14px 16px", borderRadius: 14, cursor: "pointer",
                      border: "1px solid rgba(62,42,28,0.14)", background: "#FFFCF5", color: DARK,
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
