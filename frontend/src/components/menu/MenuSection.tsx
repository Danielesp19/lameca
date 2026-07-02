"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMenu } from "@/hooks/useMenu";
import { MenuItem, MenuCategory } from "@/lib/menu-api";
import { useCart } from "@/context/CartContext";
import MenuCard from "./MenuCard";
import ProductModal from "./ProductModal";

// Paleta rediseño v2: crema cálida + chocolate + terracota + oliva
const BG     = "#F7F1E5";
const CHOCO  = "#3E2A1C";
const TERRA  = "#BC5A32";
const OLIVE  = "#6E8B4E";
const BAND   = "#EADCC3";

export default function MenuSection({ initialCategories }: { initialCategories?: MenuCategory[] }) {
  const { categories, loading, error, retry } = useMenu(initialCategories);
  const { table } = useCart();
  const [activeCategory, setActiveCategory] = useState<number | "todos">("todos");
  const [activeItemId, setActiveItemId]     = useState<number | null>(null);
  const [selected, setSelected]             = useState<MenuItem | null>(null);

  const sectionRef    = useRef<HTMLElement>(null);
  const rafRef        = useRef<number | null>(null);
  const reduceMotion  = useRef(false);

  const chips = [
    { id: "todos" as number | "todos", name: "Todos" },
    ...categories.map(c => ({ id: c.id as number | "todos", name: c.name })),
  ];

  const groups = activeCategory === "todos"
    ? categories
    : categories.filter(c => c.id === activeCategory);

  // Find the card whose center is closest to the viewport midpoint.
  // Además aplica el tilt 3D por-frame (solo transform/opacity — GPU) a cada card.
  const updateActive = useCallback(() => {
    const section = sectionRef.current;
    if (!section || document.hidden || selected !== null) return;

    const vh  = window.innerHeight;
    const mid = vh / 2;
    let bestId: number | null = null;
    let bestDist = Infinity;

    section.querySelectorAll<HTMLElement>("[data-card]").forEach(card => {
      const r = card.getBoundingClientRect();
      const center = r.top + r.height / 2;

      // Carrusel cilíndrico: t = -1 (arriba) · 0 (centro) · 1 (abajo)
      if (!reduceMotion.current) {
        let t = (center - mid) / mid;
        t = Math.max(-1.3, Math.min(1.3, t));
        const a = Math.min(Math.abs(t), 1);
        card.style.transform = `perspective(1100px) rotateX(${(-t * 9).toFixed(2)}deg) scale(${(1.015 - a * 0.07).toFixed(3)})`;
        card.style.opacity = (1 - a * 0.4).toFixed(3);
      }

      if (r.bottom <= 0 || r.top >= vh) return;
      const d = Math.abs(center - mid);
      if (d < bestDist) {
        bestDist = d;
        const raw = card.getAttribute("data-id");
        bestId = raw ? parseInt(raw, 10) : null;
      }
    });

    setActiveItemId(prev => (prev === bestId ? prev : bestId));
  }, [selected]);

  useEffect(() => {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
          background: BG, color: CHOCO,
          fontFamily: "var(--font-sans)",
          boxShadow: "0 -24px 60px rgba(62,42,28,0.35)",
        }}
      >
        {/* ── Banda de header: logo centrado + mesa ── */}
        <div style={{
          position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "16px 20px",
          background: BAND,
          borderBottom: "1px solid rgba(62,42,28,0.1)",
        }}>
          <span style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 44, height: 44, borderRadius: "50%",
            background: "#FFFCF5",
            boxShadow: "0 6px 16px -6px rgba(62,42,28,0.35)",
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="La Meca" style={{ width: 34, height: 34, objectFit: "contain" }} />
          </span>
          {table && (
            <span style={{
              position: "absolute", right: 20,
              fontSize: 10, letterSpacing: "0.22em",
              textTransform: "uppercase", opacity: 0.5,
            }}>
              {table.label}
            </span>
          )}
        </div>

        {/* ── Título con subrayado dibujado ── */}
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "26px 22px 6px" }}>
          <h2 style={{
            fontFamily: "var(--font-serif)", fontWeight: 500, fontStyle: "italic",
            fontSize: 44, lineHeight: 1, margin: 0, color: CHOCO,
          }}>
            Menú
          </h2>
          <svg width="126" height="12" viewBox="0 0 126 12" aria-hidden="true" style={{ display: "block", marginTop: 7, overflow: "visible" }}>
            <path
              d="M2 8 C 28 3, 60 11, 124 5"
              fill="none" stroke={OLIVE} strokeWidth="2.5" strokeLinecap="round"
              style={{ strokeDasharray: 135, strokeDashoffset: 135, animation: "drawLine 1s ease 0.5s forwards" }}
            />
          </svg>
          <p style={{ margin: "12px 0 0", fontSize: 13, fontWeight: 300, lineHeight: 1.55, opacity: 0.65, maxWidth: 300 }}>
            Tostado en casa, servido con calma. Elige una categoría.
          </p>
        </div>

        {/* ── Sticky category chips ── */}
        <div style={{
          position: "sticky", top: 0, zIndex: 8,
          background: "rgba(247,241,229,0.92)",
          backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(62,42,28,0.08)",
        }}>
          <div
            className="cat-scroll"
            style={{ display: "flex", gap: 9, overflowX: "auto", scrollbarWidth: "none", padding: "14px 22px 10px", maxWidth: 480, margin: "0 auto" }}
          >
            {chips.map(chip => {
              const active = chip.id === activeCategory;
              return (
                <button
                  key={String(chip.id)}
                  onClick={() => handleCategoryChange(chip.id)}
                  style={{
                    flexShrink: 0, whiteSpace: "nowrap",
                    padding: "8px 17px", borderRadius: 999, cursor: "pointer",
                    fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 12.5, letterSpacing: "0.02em",
                    border: active ? `1px solid ${CHOCO}` : "1px solid rgba(62,42,28,0.28)",
                    background: active ? CHOCO : "transparent",
                    color: active ? BG : CHOCO,
                    transition: "all .25s",
                  }}
                >
                  {chip.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Productos: grid 2 columnas ── */}
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "6px 22px 110px" }}>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 26 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ background: "#FFFCF5", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(188,90,50,0.2)" }}>
                  <div className="skeleton-light" style={{ aspectRatio: "1/1.05", width: "100%" }} />
                  <div style={{ padding: "12px 13px 13px" }}>
                    <div className="skeleton-light" style={{ height: 14, width: "65%", borderRadius: 8, marginBottom: 8 }} />
                    <div className="skeleton-light" style={{ height: 10, width: "90%", borderRadius: 8, marginBottom: 10 }} />
                    <div className="skeleton-light" style={{ height: 28, width: 90, borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: 36, marginBottom: 16, opacity: 0.3 }}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: "0 auto", display: "block" }}>
                  <circle cx="24" cy="24" r="20" stroke={CHOCO} strokeWidth="1.6"/>
                  <path d="M24 14v12M24 32v2" stroke={CHOCO} strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <p style={{ fontSize: 15, fontWeight: 500, margin: "0 0 6px", color: CHOCO }}>
                No se pudo cargar el menú
              </p>
              <p style={{ fontSize: 12, opacity: 0.5, margin: "0 0 22px", color: CHOCO }}>
                {error}
              </p>
              <button
                onClick={retry}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 22px", borderRadius: 999,
                  border: `1px solid ${CHOCO}`, background: "transparent",
                  color: CHOCO, fontFamily: "var(--font-sans)",
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
                const isHot = cat.name.toLowerCase().includes("calient");
                return (
                <div key={cat.id} style={{ marginTop: gi > 0 || activeCategory === "todos" ? 26 : 0 }}>
                  {showHeader && (
                    isFeatured ? (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <span style={{ fontSize: 15, color: TERRA }}>★</span>
                          <span style={{ fontSize: 11, letterSpacing: "0.32em", textTransform: "uppercase", color: TERRA, fontWeight: 600 }}>
                            Promoción del día
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 11 }}>
                          <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 24, margin: 0, whiteSpace: "nowrap", color: CHOCO }}>
                            {cat.name}
                          </h2>
                          <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${TERRA}, transparent)`, display: "block" }} />
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "baseline", gap: 11, marginBottom: 14 }}>
                        <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 24, margin: 0, whiteSpace: "nowrap", color: CHOCO }}>
                          {cat.name}
                        </h2>
                        <span style={{ flex: 1, height: 1, background: "rgba(62,42,28,0.14)", display: "block" }} />
                      </div>
                    )
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    {cat.items.map(item => (
                      <MenuCard
                        key={item.id}
                        item={item}
                        isActive={item.id === activeItemId}
                        onSelect={setSelected}
                        highlight={isFeatured}
                        hot={isHot}
                      />
                    ))}
                    {cat.items.length === 0 && (
                      <p style={{ gridColumn: "1 / -1", fontSize: 14, opacity: 0.5, fontStyle: "italic" }}>
                        Pronto habrá novedades aquí.
                      </p>
                    )}
                  </div>
                </div>
                );
              })}

              <p style={{ textAlign: "center", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.4, margin: "44px 0 0" }}>
                LA MECA · Café de origen
              </p>
            </div>
          )}
        </div>
      </section>

      <ProductModal item={selected} onClose={() => setSelected(null)} />
    </>
  );
}
