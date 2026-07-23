"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getSedes } from "@/lib/orders-api";
import type { SedeInfo } from "@/lib/table-session";

// Misma paleta oscura del hero (fondo #120c08/#1a120c, texto crema #F4EEE3)
const CREAM = "#F4EEE3";
const OLIVE = "#6E8B4E";

// ── Historia + fotos de cada sede ──────────────────────────────────────────
// Contenido estático (no hay panel para editarlo): reemplaza aquí el texto y
// las rutas de imagen cuando tengas el material real de cada sede. El índice
// corresponde al orden de las sedes tal como vienen del backend (sort_order).
// TODO(cliente): reemplazar historia e imágenes por las reales de cada sede.
const SEDE_CONTENT: { images: string[]; historia: string }[] = [
  {
    images: ["/sedes/campestre-1.jpg", "/sedes/campestre-2.jpg", "/sedes/campestre-3.jpg"],
    historia: "Nuestra sede Campestre nació como un escape cerca de la ciudad: aire libre, calma y el mismo café de siempre servido sin prisa.",
  },
  {
    images: ["/sedes/centro-1.jpg", "/sedes/centro-2.jpg", "/sedes/centro-3.jpg"],
    historia: "En el corazón de la ciudad, la sede Centro es el punto de encuentro de siempre: cerca de todo, con el mismo cuidado en cada taza.",
  },
];

export default function SedesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [sedes, setSedes] = useState<SedeInfo[]>([]);
  const [activeIdx, setActiveIdx] = useState(0); // primera sede preseleccionada

  useEffect(() => {
    if (open && sedes.length === 0) {
      getSedes().then(setSedes).catch(() => {});
    }
  }, [open, sedes.length]);

  const active = sedes[activeIdx] ?? null;
  const content = SEDE_CONTENT[activeIdx];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(8,5,3,0.75)", backdropFilter: "blur(6px)" }}
          />
          <motion.div
            initial={{ y: "8%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "8%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            role="dialog" aria-modal="true" aria-label="Nuestras sedes"
            style={{
              position: "fixed", zIndex: 301, inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "24px 16px", pointerEvents: "none",
            }}
          >
            <div style={{
              pointerEvents: "auto", width: "100%", maxWidth: 460, maxHeight: "90dvh",
              overflowY: "auto", borderRadius: 24,
              background: "linear-gradient(180deg, #1a120c 0%, #120c08 100%)",
              border: "1px solid rgba(244,238,227,0.1)",
              fontFamily: "var(--font-sans)", color: CREAM,
              boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
            }}>
              <div style={{ padding: "24px 22px 26px" }}>
                {/* Cabecera */}
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
                  <h2 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 26, margin: 0, color: CREAM }}>
                    Nuestras sedes
                  </h2>
                  <button onClick={onClose} aria-label="Cerrar" style={{ background: "none", border: "none", fontSize: 26, cursor: "pointer", color: CREAM, lineHeight: 1, opacity: 0.8 }}>×</button>
                </div>

                {/* ── Pestañas: una por sede, la primera preseleccionada ── */}
                {sedes.length > 0 && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                    {sedes.map((s, i) => {
                      const isActive = i === activeIdx;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setActiveIdx(i)}
                          style={{
                            flex: 1, padding: "11px 14px", borderRadius: 999, cursor: "pointer",
                            border: `1px solid ${isActive ? CREAM : "rgba(244,238,227,0.3)"}`,
                            background: isActive ? CREAM : "transparent",
                            color: isActive ? "#1a120c" : CREAM,
                            fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600,
                            letterSpacing: "0.02em", transition: "all .2s",
                          }}
                        >
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                )}

                {sedes.length === 0 && (
                  <p style={{ textAlign: "center", fontSize: 13, opacity: 0.6, padding: "20px 0" }}>Cargando sedes…</p>
                )}

                {/* ── Contenido de la sede activa ── */}
                {active && (
                  <motion.div
                    key={active.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    {/* Galería: 3 fotos contando la historia de la sede */}
                    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gridTemplateRows: "1fr 1fr", gap: 6, height: 220, borderRadius: 16, overflow: "hidden", marginBottom: 14 }}>
                      <div style={{ gridRow: "1 / 3" }}>
                        <HistoriaImage src={content.images[0]} alt={`${active.name} 1`} />
                      </div>
                      <HistoriaImage src={content.images[1]} alt={`${active.name} 2`} />
                      <HistoriaImage src={content.images[2]} alt={`${active.name} 3`} />
                    </div>

                    {/* Historia: panel negro translúcido con letra blanca */}
                    <div style={{
                      background: "rgba(0,0,0,0.35)", border: "1px solid rgba(244,238,227,0.12)",
                      borderRadius: 14, padding: "14px 16px", marginBottom: 16,
                    }}>
                      <div style={{ fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", opacity: 0.55, marginBottom: 8 }}>
                        Nuestra historia
                      </div>
                      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: "rgba(244,238,227,0.92)" }}>
                        {content.historia}
                      </p>
                    </div>

                    {/* Datos de contacto (reales, vienen del panel admin) */}
                    {active.address && (
                      <div style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.75, marginBottom: 12 }}>
                        📍 {active.address}
                      </div>
                    )}
                    {active.whatsapp_phone && (
                      <a
                        href={`https://wa.me/${active.whatsapp_phone}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 7,
                          padding: "10px 18px", borderRadius: 999, textDecoration: "none",
                          background: OLIVE, color: "#FBF7EC", fontSize: 13, fontWeight: 600,
                        }}
                      >
                        WhatsApp · +{active.whatsapp_phone}
                      </a>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Foto de la galería de historia, con fallback propio si el archivo aún no existe.
function HistoriaImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div style={{
        width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, rgba(244,238,227,0.08), rgba(244,238,227,0.03))",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" style={{ width: 32, height: 32, opacity: 0.35, objectFit: "contain" }} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  );
}
