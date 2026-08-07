"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSede } from "@/context/SedeContext";

// Misma paleta del splash de entrada: la pregunta se siente como la
// continuación de la animación de marca, no como otra pantalla que se cruza.
const BG    = "#F7F1E5";
const CHOCO = "#3E2A1C";
const TERRA = "#BC5A32";
const OLIVE = "#6E8B4E";

/**
 * Se muestra una sola vez a quien entra sin QR de sede y nunca eligió una
 * (cada local imprime su QR con ?sede=..., así que el caso normal ni lo ve).
 * Después queda recordado; se vuelve a preguntar solo desde "cambiar sede".
 *
 * Cubre la pantalla a propósito: la carta de atrás muestra TODOS los productos
 * mientras no haya sede, y dejar ver precios de cosas que no se venden en el
 * local donde está la persona es peor que hacerla elegir.
 *
 * z-index POR ENCIMA del splash (400): elegir sede es lo primero que hay que
 * resolver, así que no espera a que termine la animación de entrada. Como
 * comparte su fondo crema, el relevo entre una y otra no se nota.
 */
export default function SedeGate() {
  const { sedes, debePreguntar, elegirSede } = useSede();

  return (
    <AnimatePresence>
      {debePreguntar && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog" aria-modal="true" aria-label="Elige tu sede"
          style={{
            position: "fixed", inset: 0, zIndex: 450,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 30,
            padding: "32px 22px",
            background: BG,
            fontFamily: "var(--font-sans)", color: CHOCO,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 104, height: 104, borderRadius: "50%", background: "#FFFCF5",
              border: `2px solid ${CHOCO}`,
              boxShadow: "0 26px 60px -24px rgba(62,42,28,0.45)", marginBottom: 24,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="La Meca" style={{ width: 86, height: 86, objectFit: "contain" }} />
            </span>
            <span style={{
              display: "block", fontFamily: "var(--font-serif)", fontWeight: 600,
              fontSize: 22, letterSpacing: "0.3em", paddingLeft: "0.3em", color: CHOCO,
            }}>
              LA MECA
            </span>
            <span style={{ display: "block", width: 40, height: 1, background: TERRA, margin: "14px auto 18px" }} />
            <h2 style={{
              fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 600,
              fontSize: 27, margin: 0, color: CHOCO,
            }}>
              ¿En cuál sede estás?
            </h2>
            <p style={{
              fontSize: 13.5, fontWeight: 300, lineHeight: 1.6, margin: "12px auto 0",
              maxWidth: 330, color: "rgba(62,42,28,0.6)",
            }}>
              Cada sede tiene su propia carta. Elige la tuya para ver lo que hay
              disponible ahí.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 380 }}>
            {sedes.map((s, i) => (
              <motion.button
                key={s.id}
                onClick={() => elegirSede(s)}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
                style={{
                  position: "relative",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                  padding: "16px 18px", borderRadius: 14, cursor: "pointer",
                  border: "none", background: OLIVE, color: "#FBF7EC",
                  fontSize: 15.5, fontWeight: 600, textAlign: "left",
                  boxShadow: "0 14px 30px -16px rgba(110,139,78,0.95)",
                }}
              >
                <span>
                  {s.name}
                  {s.address && (
                    <span style={{ display: "block", fontSize: 12.5, fontWeight: 400, opacity: 0.8, marginTop: 3 }}>
                      {s.address}
                    </span>
                  )}
                </span>
                <span aria-hidden="true" style={{ fontSize: 20, flexShrink: 0 }}>→</span>
              </motion.button>
            ))}
          </div>

          <p style={{ fontSize: 11.5, letterSpacing: "0.06em", color: "rgba(62,42,28,0.42)", textAlign: "center", margin: 0 }}>
            Puedes cambiarla luego desde el pie de la carta.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
