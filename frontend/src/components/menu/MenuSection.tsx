"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMenu } from "@/hooks/useMenu";
import { MenuItem, MenuCategory } from "@/lib/menu-api";
import { prefetchVideo } from "@/lib/video-prefetch";
import MenuCard from "./MenuCard";
import ProductModal from "./ProductModal";

const ACCENT = "#C8442A";
const GOLD = "#E8A33D";

export default function MenuSection({ initialCategories }: { initialCategories?: MenuCategory[] }) {
  const { categories, loading, error, retry } = useMenu(initialCategories);
  const [activeCategory, setActiveCategory] = useState<number | "todos">("todos");
  const [activeItemId, setActiveItemId]     = useState<number | null>(null);
  const [selected, setSelected]             = useState<MenuItem | null>(null);

  const sectionRef = useRef<HTMLElement>(null);
  const rafRef     = useRef<number | null>(null);

  const chips = [
    { id: "todos" as number | "todos", name: "Todos" },
    ...categories.map(c => ({ id: c.id as number | "todos", name: c.name })),
  ];

  const groups = activeCategory === "todos"
    ? categories
    : categories.filter(c => c.id === activeCategory);

  // Find the card whose center is closest to the viewport midpoint
  const updateActive = useCallback(() => {
    const section = sectionRef.current;
    if (!section || document.hidden || selected !== null) return;

    const mid = window.innerHeight / 2;
    let bestId: number | null = null;
    let bestDist = Infinity;

    section.querySelectorAll<HTMLElement>("[data-card]").forEach(card => {
      const r = card.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= window.innerHeight) return;
      const d = Math.abs((r.top + r.height / 2) - mid);
      if (d < bestDist) {
        bestDist = d;
        const raw = card.getAttribute("data-id");
        bestId = raw ? parseInt(raw, 10) : null;
      }
    });

    setActiveItemId(prev => (prev === bestId ? prev : bestId));
  }, [selected]);

  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        updateActive();
      });
    };
    const onVis = () => {
      if (document.hidden) setActiveItemId(null);
      else updateActive();
    };

    window.addEventListener("scroll",  onScroll, { passive: true });
    window.addEventListener("resize",  onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVis);

    updateActive();
    const t1 = setTimeout(updateActive, 250);
    const t2 = setTimeout(updateActive, 800);

    return () => {
      window.removeEventListener("scroll",  onScroll);
      window.removeEventListener("resize",  onScroll);
      document.removeEventListener("visibilitychange", onVis);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [updateActive]);

  // Pause all cards while modal is open; resume on close
  useEffect(() => {
    if (selected) setActiveItemId(null);
    else updateActive();
  }, [selected, updateActive]);

  // Prefetch de videos hacia adelante: cuando una tarjeta se vuelve activa, calienta
  // la caché de los próximos 2 videos en orden de scroll para que al llegar ya estén
  // listos (sin esperar la descarga). Los previos ya quedaron en la caché HTTP.
  useEffect(() => {
    if (activeItemId == null) return;
    const flat = groups.flatMap(c => c.items);
    const idx = flat.findIndex(i => i.id === activeItemId);
    if (idx === -1) return;
    if (flat[idx]?.video_url) prefetchVideo(flat[idx].video_url);     // el actual
    for (let k = 1; k <= 2; k++) {
      const next = flat[idx + k];
      if (next?.video_url) prefetchVideo(next.video_url);             // los siguientes
    }
  // groups se recalcula cada render; basta con reaccionar al cambio de tarjeta activa.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItemId]);

  function handleCategoryChange(id: number | "todos") {
    setActiveItemId(null);
    setActiveCategory(id);
    setTimeout(updateActive, 100);
  }

  return (
    <>
      <section
        ref={sectionRef}
        id="menu"
        style={{
          position: "relative", zIndex: 2,
          background: "#0A0A0A", color: "#F2EBE3",
          fontFamily: "var(--font-sans)",
          boxShadow: "0 -24px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* ── Header ── */}
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "clamp(56px,8vw,112px) clamp(20px,5vw,68px) clamp(22px,3.5vw,38px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "clamp(14px,2vw,22px)" }}>
            <span style={{ width: 46, height: 1, background: ACCENT, display: "block" }} />
            <span style={{ fontSize: "clamp(10px,1.3vw,13px)", letterSpacing: "0.42em", paddingLeft: "0.42em", textTransform: "uppercase", opacity: 0.6 }}>
              La carta · The Menu
            </span>
          </div>
          <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: "clamp(40px,7vw,88px)", lineHeight: 0.96, margin: 0, letterSpacing: "-0.01em" }}>
            Nuestro <span style={{ fontStyle: "italic" }}>Menú</span>
          </h2>
          <p style={{ maxWidth: 520, margin: "clamp(14px,2vw,22px) 0 0", fontSize: "clamp(14px,1.5vw,17px)", fontWeight: 300, lineHeight: 1.6, opacity: 0.7 }}>
            Cada taza, tostada y servida en casa. Elige una categoría y descubre lo que preparamos hoy.
          </p>
        </div>

        {/* ── Sticky category chips ── */}
        <div style={{
          position: "sticky", top: 0, zIndex: 8,
          background: "rgba(10,10,10,0.85)",
          backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(242,235,227,0.1)",
          borderBottom: "1px solid rgba(242,235,227,0.1)",
        }}>
          <div
            className="cat-scroll"
            style={{ display: "flex", gap: 9, overflowX: "auto", scrollbarWidth: "none", padding: "12px 20px" }}
          >
            {chips.map(chip => {
              const active = chip.id === activeCategory;
              return (
                <button
                  key={String(chip.id)}
                  onClick={() => handleCategoryChange(chip.id)}
                  style={{
                    flexShrink: 0, whiteSpace: "nowrap",
                    padding: "8px 16px", borderRadius: 999, cursor: "pointer",
                    fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 12.5, letterSpacing: "0.02em",
                    border: active ? "1px solid #F2EBE3" : "1px solid rgba(242,235,227,0.25)",
                    background: active ? "#F2EBE3" : "transparent",
                    color: active ? "#0A0A0A" : "#F2EBE3",
                    transition: "all .2s",
                  }}
                >
                  {chip.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Single-column product list ── */}
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px 80px" }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ background: "#1C1714", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(242,235,227,0.08)" }}>
                  <div className="skeleton-dark" style={{ aspectRatio: "4/3", width: "100%" }} />
                  <div style={{ padding: "16px 17px 17px" }}>
                    <div className="skeleton-dark" style={{ height: 14, width: "55%", borderRadius: 8, marginBottom: 10 }} />
                    <div className="skeleton-dark" style={{ height: 11, width: "85%", borderRadius: 8, marginBottom: 6 }} />
                    <div className="skeleton-dark" style={{ height: 32, width: 120, borderRadius: 999, marginTop: 14 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: 36, marginBottom: 16, opacity: 0.25 }}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: "0 auto", display: "block" }}>
                  <circle cx="24" cy="24" r="20" stroke="#F2EBE3" strokeWidth="1.6"/>
                  <path d="M24 14v12M24 32v2" stroke="#F2EBE3" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <p style={{ fontSize: 15, fontWeight: 500, margin: "0 0 6px", color: "#F2EBE3" }}>
                No se pudo cargar el menú
              </p>
              <p style={{ fontSize: 12, opacity: 0.5, margin: "0 0 22px", color: "#F2EBE3" }}>
                {error}
              </p>
              <button
                onClick={retry}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 22px", borderRadius: 999,
                  border: "1px solid #F2EBE3", background: "transparent",
                  color: "#F2EBE3", fontFamily: "var(--font-sans)",
                  fontSize: 12, fontWeight: 500, letterSpacing: "0.1em",
                  textTransform: "uppercase", cursor: "pointer",
                }}
              >
                ↺ Reintentar
              </button>
            </div>
          ) : (
            <div key={String(activeCategory)}>
              {groups.map((cat, gi) => {
                const isFeatured = cat.slug === "destacados";
                const showHeader = activeCategory === "todos" || isFeatured;
                return (
                <div key={cat.id} style={{ marginTop: gi > 0 || activeCategory === "todos" ? 32 : 0 }}>
                  {showHeader && (
                    isFeatured ? (
                      <div style={{ marginBottom: 18 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <span style={{ fontSize: 16 }}>★</span>
                          <span style={{ fontSize: 11, letterSpacing: "0.32em", textTransform: "uppercase", color: GOLD, fontWeight: 600 }}>
                            Promoción del día
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                          <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: 28, margin: 0, whiteSpace: "nowrap", color: "#F2EBE3" }}>
                            {cat.name}
                          </h2>
                          <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${GOLD}, transparent)`, display: "block" }} />
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16 }}>
                        <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: 26, margin: 0, whiteSpace: "nowrap", color: "#F2EBE3" }}>
                          {cat.name}
                        </h2>
                        <span style={{ flex: 1, height: 1, background: "rgba(242,235,227,0.14)", display: "block" }} />
                      </div>
                    )
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {cat.items.map(item => (
                      <MenuCard
                        key={item.id}
                        item={item}
                        isActive={item.id === activeItemId}
                        onSelect={setSelected}
                        highlight={isFeatured}
                      />
                    ))}
                    {cat.items.length === 0 && (
                      <p style={{ fontSize: 14, opacity: 0.5, fontStyle: "italic" }}>
                        Pronto habrá novedades aquí.
                      </p>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <ProductModal item={selected} onClose={() => setSelected(null)} />
    </>
  );
}
