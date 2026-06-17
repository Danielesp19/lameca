"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MenuItem } from "@/lib/menu-api";

const ACCENT = "#C8A97E";

interface Props {
  item: MenuItem | null;
  onClose: () => void;
}

export default function ProductModal({ item, onClose }: Props) {
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => { if (item) setActiveImg(0); }, [item]);

  useEffect(() => {
    if (!item) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [item, onClose]);

  useEffect(() => {
    document.body.style.overflow = item ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [item]);

  const gallery = item
    ? [...(item.image_url ? [item.image_url] : []), ...(item.extra_image_urls ?? [])]
    : [];

  return (
    <AnimatePresence>
      {item && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(11,7,4,0.80)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          />

          {/* Panel — slides up from bottom */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
            style={{
              position: "fixed", zIndex: 201,
              bottom: 0, left: 0, right: 0,
              maxHeight: "92dvh",
              overflowY: "auto",
              background: "#FFFDF9",
              borderRadius: "28px 28px 0 0",
              fontFamily: "var(--font-sans)",
              color: "#241a12",
            }}
          >
            {/* Drag handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 6px" }}>
              <span style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(36,26,18,0.14)", display: "block" }} />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Cerrar"
              style={{
                position: "absolute", top: 14, right: 18,
                width: 36, height: 36, borderRadius: "50%",
                border: "1px solid rgba(36,26,18,0.14)",
                background: "transparent", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, color: "rgba(36,26,18,0.6)", lineHeight: 1,
              }}
            >×</button>

            {/* Hero image */}
            <div style={{
              position: "relative",
              height: "clamp(200px,42vw,360px)",
              overflow: "hidden",
              background: "repeating-linear-gradient(45deg,#E8DFCF 0,#E8DFCF 11px,#EEE7D9 11px,#EEE7D9 22px)",
            }}>
              {gallery[activeImg] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={activeImg}
                  src={gallery[activeImg]}
                  alt={item.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", animation: "imgFadeIn 0.35s ease both" }}
                />
              ) : item.gif_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.gif_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 72, opacity: 0.12 }}>☕</span>
                </div>
              )}
              {/* Fade to background */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 90, background: "linear-gradient(to top, #FFFDF9, transparent)" }} />
            </div>

            {/* Thumbnails (only if multiple angles) */}
            {gallery.length > 1 && (
              <div style={{ display: "flex", gap: 8, padding: "10px 20px 0", overflowX: "auto", scrollbarWidth: "none" }}>
                {gallery.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    aria-label={`Ángulo ${i + 1}`}
                    style={{
                      flexShrink: 0, width: 58, height: 44,
                      borderRadius: 10, overflow: "hidden",
                      border: `2px solid ${i === activeImg ? ACCENT : "transparent"}`,
                      padding: 0, cursor: "pointer", background: "none",
                      opacity: i === activeImg ? 1 : 0.5,
                      transition: "opacity 200ms, border-color 200ms",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Ángulo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}

            {/* Content */}
            <div style={{ padding: "20px 24px clamp(40px,6vw,64px)" }}>
              {item.is_featured && (
                <span style={{
                  display: "inline-block", marginBottom: 12,
                  fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
                  color: ACCENT, background: "rgba(200,169,126,0.1)",
                  padding: "4px 10px", borderRadius: 6,
                }}>
                  Destacado
                </span>
              )}

              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
                <h2 style={{
                  fontFamily: "var(--font-serif)", fontWeight: 600,
                  fontSize: "clamp(28px,5vw,40px)", margin: 0, lineHeight: 1.1, flex: 1,
                }}>
                  {item.name}
                </h2>
                <span style={{
                  fontFamily: "var(--font-serif)", fontWeight: 600,
                  fontSize: "clamp(26px,4vw,34px)", color: "#241a12", flexShrink: 0,
                  paddingTop: 2,
                }}>
                  ${item.price.toLocaleString("es-CO")}
                </span>
              </div>

              <div style={{
                width: "100%", height: 1,
                background: `linear-gradient(to right, ${ACCENT}66, transparent)`,
                margin: "18px 0",
              }} />

              {item.description ? (
                <p style={{
                  fontSize: "clamp(14px,1.6vw,16px)",
                  lineHeight: 1.75, fontWeight: 300,
                  color: "rgba(36,26,18,0.72)", margin: 0,
                }}>
                  {item.description}
                </p>
              ) : (
                <p style={{ fontSize: 14, fontStyle: "italic", opacity: 0.38, margin: 0 }}>
                  Sin descripción disponible.
                </p>
              )}

              {item.category && (
                <div style={{ marginTop: 22 }}>
                  <span style={{
                    fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
                    color: "rgba(36,26,18,0.46)",
                    background: "rgba(36,26,18,0.05)",
                    padding: "5px 12px", borderRadius: 6,
                  }}>
                    {item.category}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
