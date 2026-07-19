"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getSedes } from "@/lib/orders-api";
import type { SedeInfo } from "@/lib/table-session";

const CREAM = "#F7F1E5";
const DARK  = "#3E2A1C";
const TERRA = "#BC5A32";
const OLIVE = "#6E8B4E";

// Fotos de las sedes: archivos estáticos en /public/sedes/sede-<n>.jpg
// (n = posición de la sede en el orden configurado: 1, 2, …). Si el archivo
// no existe todavía, se muestra un placeholder con el logo.
function sedeImage(index: number): string {
  return `/sedes/sede-${index + 1}.jpg`;
}

export default function SedesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [sedes, setSedes] = useState<SedeInfo[]>([]);

  useEffect(() => {
    if (open && sedes.length === 0) {
      getSedes().then(setSedes).catch(() => {});
    }
  }, [open, sedes.length]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(20,12,7,0.72)", backdropFilter: "blur(6px)" }}
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
              overflowY: "auto", background: CREAM, borderRadius: 24,
              padding: "26px 22px 24px", fontFamily: "var(--font-sans)", color: DARK,
              boxShadow: "0 30px 80px rgba(10,6,4,0.55)",
            }}>
              {/* Cabecera */}
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
                <h2 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 26, margin: 0 }}>
                  Nuestras sedes
                </h2>
                <button onClick={onClose} aria-label="Cerrar" style={{ background: "none", border: "none", fontSize: 26, cursor: "pointer", color: DARK, lineHeight: 1 }}>×</button>
              </div>
              <p style={{ fontSize: 13, opacity: 0.65, margin: "0 0 18px" }}>
                Visítanos — el mismo café, dos rincones para disfrutarlo.
              </p>

              {/* Tarjetas de sede */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {sedes.map((s, i) => (
                  <div key={s.id} style={{ background: "#FFFCF5", borderRadius: 18, overflow: "hidden", border: "1px solid rgba(62,42,28,0.1)" }}>
                    <SedePhoto src={sedeImage(i)} alt={s.name} />
                    <div style={{ padding: "14px 16px 16px" }}>
                      <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 700, fontSize: 18, color: TERRA }}>
                        {s.name}
                      </div>
                      {s.address && (
                        <div style={{ fontSize: 13, marginTop: 5, lineHeight: 1.5, opacity: 0.75 }}>
                          📍 {s.address}
                        </div>
                      )}
                      {s.whatsapp_phone && (
                        <a
                          href={`https://wa.me/${s.whatsapp_phone}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 7, marginTop: 11,
                            padding: "8px 15px", borderRadius: 999, textDecoration: "none",
                            background: OLIVE, color: "#FBF7EC", fontSize: 12.5, fontWeight: 600,
                          }}
                        >
                          WhatsApp · +{s.whatsapp_phone}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {sedes.length === 0 && (
                  <p style={{ textAlign: "center", fontSize: 13, opacity: 0.55, padding: "20px 0" }}>Cargando sedes…</p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Foto de la sede con fallback: si el archivo aún no existe, placeholder con logo.
function SedePhoto({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div style={{
        height: 150, display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #EFE4D2, #E2D2BC)",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" style={{ width: 56, height: 56, opacity: 0.5, objectFit: "contain" }} />
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
      style={{ width: "100%", height: 170, objectFit: "cover", display: "block" }}
    />
  );
}
