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
const PREM_CREAM = "#F4EEE3"; // Destacados: misma paleta oscura del modal "Nuestras sedes"

export default function MenuSection({ initialCategories }: { initialCategories?: MenuCategory[] }) {
  const { categories, loading, error, retry } = useMenu(initialCategories);
  const { table } = useCart();
  const [activeCategory, setActiveCategory] = useState<number | "todos">("todos");
  // Clave por INSTANCIA de tarjeta (categoría:producto): un mismo producto puede
  // aparecer en dos filas (p.ej. Destacados) y solo debe activarse una copia.
  const [activeCardKey, setActiveCardKey]   = useState<string | null>(null);
  const [selected, setSelected]             = useState<MenuItem | null>(null);

  const sectionRef    = useRef<HTMLElement>(null);
  const listRef       = useRef<HTMLDivElement>(null);

  const chips = [
    { id: "todos" as number | "todos", name: "Todos" },
    ...categories.map(c => ({ id: c.id as number | "todos", name: c.name })),
  ];

  const groups = activeCategory === "todos"
    ? categories
    : categories.filter(c => c.id === activeCategory);

  // Find the card whose center is closest to the viewport midpoint (both axes —
  // the rows also scroll horizontally). SOLO lee posiciones: cero escrituras de
  // estilo por frame — el realce de la tarjeta activa lo hace CSS (compositor).
  const updateActive = useCallback(() => {
    const section = sectionRef.current;
    if (!section || document.hidden || selected !== null) return;

    const vh   = window.innerHeight;
    const vw   = window.innerWidth;
    const midY = vh / 2;
    const midX = vw / 2;
    let bestKey: string | null = null;
    let bestDist = Infinity;

    // Recorre por BLOQUE de categoría: un solo getBoundingClientRect para
    // descartar bloques lejanos, en vez de medir tarjeta por tarjeta.
    section.querySelectorAll<HTMLElement>(".cat-block").forEach(block => {
      const b = block.getBoundingClientRect();
      if (b.bottom < -200 || b.top > vh + 200) return;

      block.querySelectorAll<HTMLElement>("[data-card]").forEach(card => {
        const r = card.getBoundingClientRect();
        if (r.bottom <= 0 || r.top >= vh) return;
        if (r.right <= 0 || r.left >= vw) return; // fuera en horizontal
        const centerY = r.top + r.height / 2;
        const centerX = r.left + r.width / 2;
        // En la grilla de 2 columnas ambas quedan a la misma distancia del
        // centro: las tarjetas con video reciben un pequeño bonus para que
        // también se activen (y reproduzcan) cuando están en la columna derecha.
        let d = Math.abs(centerY - midY) + Math.abs(centerX - midX) * 0.9;
        if (card.hasAttribute("data-video")) d -= 30;
        if (d < bestDist) {
          bestDist = d;
          bestKey = card.getAttribute("data-key");
        }
      });
    });

    setActiveCardKey(prev => (prev === bestKey ? prev : bestKey));
  }, [selected]);

  useEffect(() => {
    // capture: true → también se dispara con el scroll horizontal de los
    // carruseles (no solo el vertical de la página). Por eso NO se puede medir
    // en cada frame con rAF: hacer getBoundingClientRect() de todas las
    // tarjetas en cada tick, justo mientras el dedo arrastra el carrusel,
    // competía con el compositor del navegador y se sentía trabado/pegajoso
    // (reportado en producción). En vez de eso, se espera a que el scroll se
    // asiente (~110ms sin nuevos eventos) y ahí sí se mide una sola vez — la
    // tarjeta activa (video/realce) queda casi igual de responsiva, pero el
    // gesto de scroll ya no compite por el hilo principal mientras ocurre.
    const debounceRef = { current: null as number | null };
    const onScroll = () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        debounceRef.current = null;
        updateActive();
      }, 110);
    };
    const onVis = () => {
      if (document.hidden) setActiveCardKey(null);
      else updateActive();
    };

    window.addEventListener("scroll",  onScroll, { passive: true, capture: true });
    window.addEventListener("resize",  onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVis);

    updateActive();
    const t1 = setTimeout(updateActive, 250);
    const t2 = setTimeout(updateActive, 800);

    return () => {
      window.removeEventListener("scroll",  onScroll, { capture: true });
      window.removeEventListener("resize",  onScroll);
      document.removeEventListener("visibilitychange", onVis);
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [updateActive]);

  // Pause all cards while modal is open; resume on close
  useEffect(() => {
    if (selected) setActiveCardKey(null);
    else updateActive();
  }, [selected, updateActive]);

  // Precarga en segundo plano mientras el usuario está en el hero: portadas y
  // posters (imágenes, concurrencia 3) y luego los videos vía <link prefetch> a
  // baja prioridad. Así al bajar al menú las tarjetas ya están listas y los
  // videos arrancan casi sin lag. Arranca en idle para no competir con el render
  // inicial ni con el video del hero.
  useEffect(() => {
    if (!categories.length || typeof window === "undefined") return;

    const imgs: string[] = [];
    const vids: string[] = [];
    for (const cat of categories) {
      for (const it of cat.items) {
        if (it.video_url) {
          vids.push(it.video_url);
          const p = it.image_url ?? it.video_poster_url ?? null;
          if (p) imgs.push(p);
        } else if (it.image_url) {
          imgs.push(it.image_url);
        }
      }
    }
    const uniqImgs = [...new Set(imgs)];
    // Los videos SÍ se precargan (decisión de producto: fluidez > datos — los
    // clips ya vienen comprimidos a ~1-3 MB por el backend). Tope de seguridad:
    // nunca más de 8, por si algún clip viejo quedó sin comprimir.
    const uniqVids = [...new Set(vids)].slice(0, 8);

    let cancelled = false;
    const links: HTMLLinkElement[] = [];

    const prefetchVideos = () => {
      if (cancelled) return;
      for (const src of uniqVids) {
        const l = document.createElement("link");
        l.rel = "prefetch";
        l.as = "video";
        l.href = src;
        document.head.appendChild(l);
        links.push(l);
      }
    };

    const preloadImages = () => {
      let i = 0, active = 0;
      const MAX = 3;
      const pump = () => {
        if (cancelled) return;
        while (active < MAX && i < uniqImgs.length) {
          const src = uniqImgs[i++];
          active++;
          const img = new Image();
          const done = () => { active--; pump(); };
          img.onload = done;
          img.onerror = done;
          img.src = src;
        }
        if (i >= uniqImgs.length && active === 0) prefetchVideos();
      };
      pump();
    };

    const hasIdle = typeof window.requestIdleCallback === "function";
    const handle: number = hasIdle
      ? window.requestIdleCallback(() => preloadImages(), { timeout: 1500 })
      : window.setTimeout(preloadImages, 1200);

    return () => {
      cancelled = true;
      links.forEach(l => l.remove());
      if (hasIdle) window.cancelIdleCallback(handle);
      else clearTimeout(handle);
    };
  }, [categories]);

  function handleCategoryChange(id: number | "todos") {
    setActiveCardKey(null);
    setActiveCategory(id);
    // El contenido cambia en vertical, bajo la barra: lleva la vista al inicio
    // de los productos con un desplazamiento suave (sin saltos bruscos).
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - 62;
      if (window.scrollY > top + 40) window.scrollTo({ top, behavior: "smooth" });
    });
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
          overflowX: "clip",
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
            fontFamily: "var(--font-display)", fontWeight: 600, fontStyle: "italic",
            fontSize: 44, lineHeight: 1, margin: 0, color: CHOCO,
            letterSpacing: "-0.01em",
            animation: "titleIn 0.8s cubic-bezier(0.2,0.7,0.2,1) both",
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
          <p style={{ margin: "12px 0 0", fontSize: 13, fontWeight: 300, lineHeight: 1.55, maxWidth: 300, color: "rgba(62,42,28,0.65)", animation: "fadeUp 0.7s ease 0.35s both" }}>
            Tostado en casa, servido con calma. Elige una categoría.
          </p>
        </div>

        {/* ── Sticky category chips ──
            Fondo 100% opaco: cualquier transparencia aquí "titila" cuando el
            contenido pasa por detrás al scrollear. Sin backdrop-filter (jank). */}
        <div style={{
          position: "sticky", top: 0, zIndex: 8,
          background: BG,
          borderBottom: "1px solid rgba(62,42,28,0.08)",
          boxShadow: "0 8px 18px -14px rgba(62,42,28,0.28)",
        }}>
          <div
            className="cat-scroll"
            style={{
              display: "flex", gap: 9, overflowX: "auto", scrollbarWidth: "none",
              touchAction: "pan-x pan-y",
              padding: "14px 22px 10px", maxWidth: 480, margin: "0 auto",
              animation: "fadeUp 0.6s ease 0.45s both",
            }}
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
                    animation: active ? "chipPop 0.35s ease" : "none",
                  }}
                >
                  {chip.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Productos: grid 2 columnas ── */}
        <div ref={listRef} style={{ maxWidth: 480, margin: "0 auto", padding: "6px 22px 110px" }}>
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
            // key + fadeUp: al cambiar de categoría el contenido entra con un
            // desvanecido suave en vez de saltar de golpe
            <div key={String(activeCategory)} style={{ animation: "fadeUp 0.45s ease both" }}>
              {groups.map((cat, gi) => {
                const isFeatured = cat.slug === "destacados";
                const showHeader = activeCategory === "todos" || isFeatured;
                const isHot = cat.name.toLowerCase().includes("calient");
                return (
                // .cat-block: SIN content-visibility (se quitó a propósito —
                // ver globals.css — porque dejaba el carrusel un instante sin
                // responder al tacto justo al llegar a él). El padding
                // lateral/inferior mete la sangría del carrusel y las sombras
                // dentro de la caja contenida; los márgenes negativos lo
                // compensan para no mover nada.
                // Destacados: fondo oscuro de SECCIÓN (no por tarjeta) — el bleed
                // horizontal ya existente (margin negativo) hace que el color
                // llegue de borde a borde en pantallas de celular. OJO: a
                // diferencia de las categorías normales, aquí NO se cancela el
                // padding-bottom con un margin-bottom negativo — ese truco asume
                // un bloque transparente; con fondo real, cancelarlo hacía que la
                // categoría siguiente se dibujara encima de esos últimos 40px.
                <div
                  key={cat.id}
                  className="cat-block"
                  style={{
                    margin: isFeatured
                      ? `${gi > 0 || activeCategory === "todos" ? 26 : 0}px -22px 0px`
                      : `${gi > 0 || activeCategory === "todos" ? 26 : 0}px -22px -40px`,
                    padding: isFeatured ? "28px 22px 34px" : "0 22px 40px",
                    // Misma paleta oscura del modal "Nuestras sedes" (#1a120c → #120c08).
                    background: isFeatured ? "linear-gradient(180deg, #1a120c 0%, #120c08 100%)" : "transparent",
                    borderTop: isFeatured ? "1px solid rgba(244,238,227,0.1)" : "none",
                    borderBottom: isFeatured ? "1px solid rgba(244,238,227,0.1)" : "none",
                  }}
                >
                  {showHeader && (
                    <div style={{ display: "flex", alignItems: "baseline", gap: 11, marginBottom: 14, animation: "fadeUp 0.6s ease both" }}>
                      <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 600, fontSize: 23, margin: 0, whiteSpace: "nowrap", color: isFeatured ? PREM_CREAM : CHOCO, letterSpacing: "-0.01em" }}>
                        {cat.name}
                      </h2>
                      <span style={{ flex: 1, height: 1, background: isFeatured ? "rgba(244,238,227,0.25)" : "rgba(62,42,28,0.14)", display: "block", transformOrigin: "left", animation: "lineGrow 0.9s cubic-bezier(0.2,0.7,0.2,1) 0.25s both" }} />
                    </div>
                  )}

                  {/* "Todos": carrusel horizontal por categoría (se desliza de lado).
                      Categoría seleccionada: grilla estática 2 columnas con todos
                      los productos. */}
                  {cat.items.length > 0 ? (
                    activeCategory === "todos" ? (
                      <CategoryCarousel
                        items={cat.items}
                        catId={cat.id}
                        isHot={isHot}
                        isFeatured={isFeatured}
                        activeCardKey={activeCardKey}
                        onSelect={setSelected}
                      />
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 9,
                          padding: "4px 0 10px",
                        }}
                      >
                        {cat.items.map((item, idx) => (
                          <MenuCard
                            key={item.id}
                            item={item}
                            cardKey={`${cat.id}:${item.id}`}
                            isActive={activeCardKey === `${cat.id}:${item.id}`}
                            onSelect={setSelected}
                            hot={isHot}
                            index={idx}
                            premium={isFeatured}
                          />
                        ))}
                      </div>
                    )
                  ) : (
                    <p style={{ fontSize: 14, opacity: 0.5, fontStyle: "italic" }}>
                      Pronto habrá novedades aquí.
                    </p>
                  )}
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

// ── Carrusel horizontal de una categoría (vista "Todos") ─────────────────────
// Con tarjetas más anchas, a veces 2 llenan exactamente el ancho de pantalla
// y no queda ninguna asomada por el borde — sin esa pista visual, parece que
// la categoría solo tiene esos 2 productos. Este componente mide si el
// carrusel realmente tiene más contenido (scrollWidth > clientWidth) y, solo
// en ese caso, muestra una flechita sutil invitando a deslizar.
function CategoryCarousel({
  items, catId, isHot, isFeatured, activeCardKey, onSelect,
}: {
  items: MenuItem[];
  catId: number;
  isHot: boolean;
  isFeatured: boolean;
  activeCardKey: string | null;
  onSelect: (item: MenuItem) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setHasMore(el.scrollWidth > el.clientWidth + 4);
    check();
    // Reacciona si las fotos cambian el ancho disponible o si rotas el celular.
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items]);

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={scrollRef}
        className="cat-scroll"
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          // "proximity" (no "mandatory") + touchAction explícito: con
          // mandatory el navegador bloqueaba el scroll vertical de la página
          // al tocar el carrusel a mitad de pantalla. Así deja pasar ambos
          // ejes con naturalidad.
          scrollSnapType: "x proximity",
          touchAction: "pan-x pan-y",
          overscrollBehaviorX: "contain",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          padding: "4px 0 10px",
        }}
      >
        {items.map((item, idx) => (
          <div
            key={item.id}
            style={{ flex: "0 0 48%", maxWidth: 225, minWidth: 162, scrollSnapAlign: "start" }}
          >
            <MenuCard
              item={item}
              cardKey={`${catId}:${item.id}`}
              isActive={activeCardKey === `${catId}:${item.id}`}
              onSelect={onSelect}
              hot={isHot}
              index={idx}
              premium={isFeatured}
            />
          </div>
        ))}
      </div>

      {hasMore && (
        // Al borde real de la pantalla (no del borde de las tarjetas): el
        // -22px compensa el padding lateral de .cat-block, que es lo que
        // separa este carrusel del borde de pantalla real. Clickeable: un
        // empujoncito al carrusel, no solo un adorno.
        <button
          type="button"
          aria-label="Ver más productos de esta categoría"
          onClick={() => scrollRef.current?.scrollBy({ left: 150, behavior: "smooth" })}
          style={{
            position: "absolute", top: "50%", right: -22, transform: "translateY(-50%)", zIndex: 3,
            display: "flex", alignItems: "center", justifyContent: "flex-end",
            width: 40, height: 56, padding: "0 2px 0 0",
            border: "none", background: "transparent", cursor: "pointer",
            color: isFeatured ? "#D9B382" : "#3E2A1C",
            filter: isFeatured
              ? "drop-shadow(0 1px 4px rgba(0,0,0,0.65))"
              : "drop-shadow(0 1px 3px rgba(255,255,255,0.55))",
            animation: "peekHint 1.7s ease-in-out infinite",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </button>
      )}
    </div>
  );
}
