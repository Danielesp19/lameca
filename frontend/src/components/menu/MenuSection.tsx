"use client";

import { useState } from "react";
import { useMenu } from "@/hooks/useMenu";
import { MenuItem } from "@/lib/menu-api";
import MenuCard from "./MenuCard";
import ProductModal from "./ProductModal";

const ACCENT = "#C8A97E";

export default function MenuSection() {
  const { categories, loading, error } = useMenu();
  const [activeId, setActiveId]         = useState<number | "todos">("todos");
  const [selected, setSelected]         = useState<MenuItem | null>(null);

  const chips = [
    { id: "todos" as number | "todos", name: "Todos" },
    ...categories.map(c => ({ id: c.id as number | "todos", name: c.name })),
  ];

  const groups = activeId === "todos"
    ? categories
    : categories.filter(c => c.id === activeId);

  return (
    <>
    <section
      id="menu"
      style={{ position: "relative", zIndex: 2, background: "#F2ECE1", color: "#241a12", fontFamily: "var(--font-sans)", boxShadow: "0 -24px 60px rgba(0,0,0,0.4)" }}
    >
      {/* ── Section header ── */}
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
      <div style={{ position: "sticky", top: 0, zIndex: 8, background: "rgba(242,236,225,0.92)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderTop: "1px solid rgba(36,26,18,0.08)", borderBottom: "1px solid rgba(36,26,18,0.08)" }}>
        <div
          className="cat-scroll"
          style={{ display: "flex", gap: 10, overflowX: "auto", padding: "14px clamp(20px,5vw,68px)", maxWidth: 1320, margin: "0 auto" }}
        >
          {chips.map(chip => {
            const active = chip.id === activeId;
            return (
              <button
                key={chip.id}
                onClick={() => setActiveId(chip.id)}
                style={{
                  flexShrink: 0, whiteSpace: "nowrap",
                  padding: "9px 18px", borderRadius: 999, cursor: "pointer",
                  fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 13, letterSpacing: "0.02em",
                  border: active ? "1px solid #241a12" : "1px solid rgba(36,26,18,0.18)",
                  background: active ? "#241a12" : "transparent",
                  color: active ? "#F2ECE1" : "#241a12",
                  transition: "all .2s",
                }}
              >
                {chip.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Products ── */}
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "clamp(34px,4.5vw,60px) clamp(20px,5vw,68px) clamp(64px,9vw,128px)" }}>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,248px),1fr))", gap: "clamp(16px,2vw,26px)" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: "#FFFDF9", borderRadius: 18, overflow: "hidden", border: "1px solid rgba(36,26,18,0.08)" }}>
                <div className="skeleton-light" style={{ height: 186 }} />
                <div style={{ padding: 20 }}>
                  <div className="skeleton-light" style={{ height: 14, width: "55%", borderRadius: 8, marginBottom: 10 }} />
                  <div className="skeleton-light" style={{ height: 11, width: "85%", borderRadius: 8, marginBottom: 6 }} />
                  <div className="skeleton-light" style={{ height: 11, width: "65%", borderRadius: 8 }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p style={{ color: "#B45309", fontSize: 14, fontStyle: "italic" }}>
            No se pudo cargar el menú. Verifica que el servidor esté activo.
          </p>
        ) : (
          <div key={String(activeId)}>
            {groups.map(cat => (
              <div key={cat.id} style={{ marginBottom: "clamp(40px,5vw,72px)" }}>
                {/* Show category heading only in "Todos" mode */}
                {activeId === "todos" && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: "clamp(18px,2.4vw,30px)" }}>
                    <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: "clamp(24px,3vw,38px)", margin: 0, whiteSpace: "nowrap" }}>
                      {cat.name}
                    </h3>
                    <span style={{ flex: 1, height: 1, background: "rgba(36,26,18,0.12)", display: "block" }} />
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,248px),1fr))", gap: "clamp(16px,2vw,26px)" }}>
                  {cat.items.map((item, idx) => (
                    <MenuCard key={item.id} item={item} index={idx} onSelect={setSelected} />
                  ))}
                  {cat.items.length === 0 && (
                    <p style={{ fontSize: 14, opacity: 0.5, fontStyle: "italic" }}>Pronto habrá novedades aquí.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
    <ProductModal item={selected} onClose={() => setSelected(null)} />
    </>
  );
}
