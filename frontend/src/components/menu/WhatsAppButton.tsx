"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { PEDIDOS_HABILITADOS } from "@/lib/features";
import { useSede } from "@/context/SedeContext";
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

// Ícono oficial de WhatsApp en SVG (sin emojis — se ve nítido en todo dispositivo)
function WaIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.83 14.12c-.25.7-1.44 1.34-2 1.4-.51.05-1.16.24-3.9-.81-3.3-1.3-5.42-4.65-5.58-4.87-.16-.22-1.33-1.77-1.33-3.38 0-1.61.85-2.4 1.15-2.73.3-.33.65-.41.87-.41.22 0 .43 0 .62.01.2.01.47-.08.73.56.27.64.9 2.2.98 2.36.08.16.13.35.03.57-.1.22-.16.35-.31.54-.16.19-.33.42-.47.57-.16.16-.32.33-.14.64.19.32.83 1.36 1.78 2.21 1.22 1.09 2.25 1.42 2.57 1.58.32.16.5.13.69-.08.19-.22.79-.92 1-1.24.21-.32.42-.27.71-.16.29.11 1.84.87 2.15 1.03.32.16.53.24.61.37.08.14.08.79-.17 1.49z"/>
    </svg>
  );
}

export default function WhatsAppButton() {
  const { hasSession, count } = useCart();
  const { sede } = useSede();
  const [sedes, setSedes] = useState<SedeInfo[]>([]);
  const [pick, setPick] = useState(false);

  useEffect(() => {
    getSedes().then(list => setSedes(list.filter(s => s.whatsapp_phone)));
  }, []);

  // Se muestra sin sesión de QR válida (público o caducada) Y con el carrito
  // vacío: cuando hay productos, el carrito flotante toma su lugar y el envío
  // por WhatsApp sale desde ahí con el pedido armado.
  //
  // Con los pedidos apagados eso no aplica y el botón va SIEMPRE: el carrito
  // flotante ya no se pinta, así que si alguien llega con un carrito viejo
  // guardado en el navegador (count > 0) o con una sesión de mesa vieja, se
  // quedaría sin ningún botón de contacto. Ver features.ts.
  if (PEDIDOS_HABILITADOS && (hasSession || count > 0)) return null;

  function go(sede: SedeInfo) {
    window.open(waLink(sede.whatsapp_phone ?? FALLBACK_PHONE), "_blank", "noopener");
    setPick(false);
  }

  function onClick() {
    // Si el cliente ya está en la carta de una sede (llegó por su QR o la
    // eligió), se escribe a ESA: preguntarle de nuevo a cuál sede quiere
    // escribir, cuando acaba de decirlo, es un paso de más.
    const activa = sede && sedes.find(s => s.id === sede.id);
    if (activa) go(activa);
    else if (sedes.length > 1) setPick(true);
    else if (sedes.length === 1) go(sedes[0]);
    else window.open(waLink(FALLBACK_PHONE), "_blank", "noopener");
  }

  return (
    <>
      {/* Botón flotante minimalista: solo el ícono, esquina inferior derecha —
          no invade la lectura del menú (feedback del cliente) */}
      <motion.button
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 26, delay: 0.6 }}
        onClick={onClick}
        style={{
          position: "fixed", bottom: 18, right: 16, zIndex: 150,
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 58, height: 58, borderRadius: "50%",
          border: "none", cursor: "pointer",
          background: OLIVE, color: "#FBF7EC",
          boxShadow: "0 16px 34px -12px rgba(110,139,78,0.7)",
        }}
        whileTap={{ scale: 0.94 }}
        aria-label="Pedir por WhatsApp"
      >
        <span aria-hidden="true" style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "2px solid rgba(110,139,78,0.55)",
          animation: "pulseRing 2.2s ease-out infinite",
          pointerEvents: "none",
        }} />
        <WaIcon />
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
                {/* Cada sede con la misma vestimenta del botón flotante: verde
                    oliva y el aro que late. El retardo escalonado evita que
                    todas pulsen al unísono, que se siente mecánico. */}
                {sedes.map((s, i) => (
                  <motion.button
                    key={s.id}
                    onClick={() => go(s)}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      position: "relative", overflow: "hidden",
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                      padding: "14px 16px", borderRadius: 14, cursor: "pointer",
                      border: "none", background: OLIVE, color: "#FBF7EC",
                      fontSize: 14.5, fontWeight: 600, textAlign: "left",
                      boxShadow: "0 12px 26px -14px rgba(110,139,78,0.9)",
                    }}
                  >
                    <span aria-hidden="true" style={{
                      position: "absolute", inset: 0, borderRadius: 14,
                      border: "2px solid rgba(251,247,236,0.55)",
                      animation: `pulseRingWide 2.2s ease-out ${i * 0.45}s infinite`,
                      pointerEvents: "none",
                    }} />
                    <span>
                      {s.name}
                      {s.address && <span style={{ display: "block", fontSize: 12, fontWeight: 400, opacity: 0.75, marginTop: 2 }}>{s.address}</span>}
                    </span>
                    <span style={{ display: "flex", flexShrink: 0 }}><WaIcon size={20} /></span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
