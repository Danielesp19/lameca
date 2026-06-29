"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MenuItem, SUGAR_OPTIONS, DEFAULT_SUGAR, caffeineInfo } from "@/lib/menu-api";
import { useCart } from "@/context/CartContext";

const ACCENT = "#C8442A";

interface GalleryItem {
  type: "video" | "image";
  src: string;
  thumb: string;
}

interface Props {
  item: MenuItem | null;
  onClose: () => void;
}

export default function ProductModal({ item, onClose }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [added, setAdded] = useState(false);
  const [sugar, setSugar] = useState<string>(DEFAULT_SUGAR);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { add, hasSession } = useCart();

  useEffect(() => {
    if (item) { setActiveIdx(0); setAdded(false); setSugar(DEFAULT_SUGAR); }
  }, [item]);

  function handleAdd() {
    if (!item) return;
    const sugarLevel = item.has_sugar_option ? sugar : undefined;
    add({ id: item.id, name: item.name, price: item.price, image_url: item.image_url }, 1, sugarLevel);
    setAdded(true);
    setTimeout(onClose, 550);
  }

  const caffeine = item ? caffeineInfo(item.caffeine_level) : null;

  // ESC to close
  useEffect(() => {
    if (!item) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [item, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = item ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [item]);

  // Play modal video when it mounts (fallback for autoplay)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.playbackRate = 0.85;
    v.play().catch(() => {});
  });

  // Build gallery
  const gallery: GalleryItem[] = item
    ? [
        ...(item.video_url ? [{ type: "video" as const, src: item.video_url, thumb: item.image_url ?? "" }] : []),
        ...[...(item.image_url ? [item.image_url] : []), ...(item.extra_image_urls ?? [])].map(src => ({
          type: "image" as const,
          src,
          thumb: src,
        })),
      ]
    : [];

  const safeIdx = Math.min(activeIdx, Math.max(0, gallery.length - 1));
  const sel = gallery[safeIdx] ?? null;
  const isVideoHero = sel?.type === "video";

  return (
    <AnimatePresence>
      {item && (
        <>
          {/* Backdrop — más oscuro */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(10,6,4,0.82)",
              backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
            }}
          />

          {/* Sheet — flotante, angosto, centrado */}
          <motion.div
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "110%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 36 }}
            style={{
              position: "fixed", zIndex: 201,
              bottom: "clamp(12px,2.5vh,24px)",
              left: "clamp(12px,4vw,24px)",
              right: "clamp(12px,4vw,24px)",
              maxHeight: "88dvh",
              maxWidth: 460,
              margin: "0 auto",
              background: "#1C1714",
              borderRadius: 26,
              overflow: "hidden",
              fontFamily: "var(--font-sans)",
              color: "#F2EBE3",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 32px 80px rgba(10,6,4,0.7), 0 0 0 1px rgba(242,235,227,0.08)",
            }}
          >
            {/* ── Hero media ── */}
            <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", background: "#E8DFCF", overflow: "hidden", flexShrink: 0 }}>
              {isVideoHero ? (
                <video
                  ref={videoRef}
                  src={sel!.src}
                  muted playsInline loop autoPlay
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : sel ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={sel.src}
                  src={sel.src}
                  alt={item.name}
                  style={{
                    position: "absolute", inset: 0, width: "100%", height: "100%",
                    objectFit: "cover", animation: "imgFadeIn 0.35s ease both",
                  }}
                />
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 64, opacity: 0.1 }}>☕</span>
                </div>
              )}

              {/* Handle bar */}
              <span style={{
                position: "absolute", top: 10, left: "50%",
                transform: "translateX(-50%)",
                width: 42, height: 5, borderRadius: 3,
                background: "rgba(242,235,227,0.3)",
                display: "block", pointerEvents: "none",
              }} />

              {/* Close */}
              <button
                aria-label="Cerrar"
                onClick={onClose}
                style={{
                  position: "absolute", top: 14, right: 14,
                  width: 40, height: 40, borderRadius: "50%",
                  border: "none",
                  background: "rgba(20,12,7,0.55)",
                  backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
                  color: "#F2EBE3", fontSize: 22, lineHeight: 1, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div style={{ overflowY: "auto", flex: 1 }}>

              {/* Thumbnail strip */}
              {gallery.length > 1 && (
                <div
                  className="cat-scroll"
                  style={{
                    display: "flex", gap: 9, overflowX: "auto",
                    scrollbarWidth: "none", padding: "14px 20px 4px",
                  }}
                >
                  {gallery.map((it, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIdx(i)}
                      aria-label={`Vista ${i + 1}`}
                      style={{
                        position: "relative", flexShrink: 0,
                        width: 62, height: 62, borderRadius: 12, overflow: "hidden",
                        padding: 0, background: "#E8DFCF", cursor: "pointer",
                        border: `2px solid ${i === safeIdx ? "#F2EBE3" : "transparent"}`,
                        opacity: i === safeIdx ? 1 : 0.65,
                        transition: "all .2s",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={it.thumb || item.image_url || ""}
                        alt={`Vista ${i + 1}`}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      {it.type === "video" && (
                        <span style={{
                          position: "absolute", inset: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: "rgba(20,12,7,0.35)", color: "#fff", fontSize: 13,
                        }}>
                          ▶
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Content */}
              <div style={{ padding: "18px 22px 26px" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                  <h2 style={{
                    fontFamily: "var(--font-serif)", fontWeight: 600,
                    fontSize: 30, margin: 0, lineHeight: 1, color: "#F2EBE3",
                  }}>
                    {item.name}
                  </h2>
                  <span style={{
                    fontFamily: "var(--font-serif)", fontWeight: 600,
                    fontSize: 28, whiteSpace: "nowrap", color: "#F2EBE3",
                  }}>
                    ${item.price.toLocaleString("es-CO")}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0 16px" }}>
                  <span style={{ width: 28, height: 1, background: ACCENT, display: "block" }} />
                  <span style={{ fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", opacity: 0.5 }}>
                    Descripción
                  </span>
                </div>

                <p style={{ fontSize: 14.5, fontWeight: 300, lineHeight: 1.65, opacity: 0.72, margin: 0, color: "#F2EBE3" }}>
                  {item.description ?? "Sin descripción disponible."}
                </p>

                {/* ── Nivel de cafeína ── */}
                {caffeine && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 8, marginTop: 18,
                    padding: "8px 14px", borderRadius: 999,
                    background: "rgba(242,235,227,0.08)", border: `1px solid ${ACCENT}55`,
                  }}>
                    <span style={{ fontSize: 15, letterSpacing: caffeine.beans > 1 ? "-2px" : 0 }}>{caffeine.emoji}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 500, color: "#F2EBE3" }}>{caffeine.label}</span>
                  </div>
                )}

                {/* ── Selector de nivel de azúcar (solo en modo QR) ── */}
                {hasSession && item.has_sugar_option && (
                  <div style={{ marginTop: 22 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <span style={{ width: 28, height: 1, background: ACCENT, display: "block" }} />
                      <span style={{ fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", opacity: 0.5 }}>
                        Nivel de azúcar
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {SUGAR_OPTIONS.map(opt => {
                        const active = sugar === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setSugar(opt.value)}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 6,
                              padding: "9px 14px", borderRadius: 999, cursor: "pointer",
                              fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 500,
                              border: `1.5px solid ${active ? "#F2EBE3" : "rgba(242,235,227,0.22)"}`,
                              background: active ? "#F2EBE3" : "transparent",
                              color: active ? "#0A0A0A" : "#F2EBE3",
                              transition: "all .18s",
                            }}
                          >
                            <span style={{ fontSize: 14 }}>{opt.emoji}</span>
                            {opt.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {hasSession ? (
                  <button
                    onClick={handleAdd}
                    disabled={added}
                    style={{
                      marginTop: 24, width: "100%",
                      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9,
                      padding: "15px 22px", borderRadius: 999,
                      border: "none", background: added ? "#3E7C4F" : "#F2EBE3", color: added ? "#F2EBE3" : "#0A0A0A",
                      fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500,
                      letterSpacing: "0.12em", textTransform: "uppercase", cursor: added ? "default" : "pointer",
                      transition: "transform .2s, background .2s",
                    }}
                    onMouseEnter={e => { if (!added) e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
                  >
                    {added
                      ? <>Agregado <span style={{ fontSize: 16 }}>✓</span></>
                      : <>Agregar al pedido <span style={{ fontSize: 16 }}>+</span></>}
                  </button>
                ) : (
                  // Modo público (sin QR): no hay carrito; se invita a escanear o a WhatsApp.
                  <div style={{
                    marginTop: 24, padding: "14px 16px", borderRadius: 14,
                    background: "rgba(242,235,227,0.06)", border: `1px dashed ${ACCENT}88`,
                    fontSize: 13, lineHeight: 1.55, color: "#F2EBE3", textAlign: "center",
                  }}>
                    📷 Escanea el <strong>QR de tu mesa</strong> para pedir desde la app,
                    o usa el botón de <strong>WhatsApp</strong> para coordinar tu pedido.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
