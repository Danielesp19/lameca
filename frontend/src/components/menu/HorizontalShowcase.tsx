"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MenuCategory, MenuItem } from "@/lib/menu-api";
import { useShowcaseBgPin } from "./useShowcaseBgPin";

// Misma paleta oscura de Destacados/Otros y del modal "Nuestras sedes".
const CREAM    = "#F4EEE3";
const GOLD     = "#D9B382";
const DARK_BOT = "#0d0805";

function ChevronButton({ dir, onClick }: { dir: "left" | "right"; onClick: () => void }) {
  // Misma flechita (mismo SVG, mismo color, mismo drop-shadow) que ya usa el
  // carrusel de categorías — "las flechitas que tenemos".
  return (
    <button
      type="button"
      aria-label={dir === "left" ? "Método anterior" : "Método siguiente"}
      onClick={onClick}
      style={{
        flex: "0 0 40px",
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 40, height: 56, padding: 0,
        marginTop: 26, // más bajitas: a la altura del centro de la foto, no del bloque completo
        border: "none", background: "transparent", cursor: "pointer",
        color: GOLD,
        filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.65))",
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {dir === "left" ? <polyline points="15 6 9 12 15 18" /> : <polyline points="9 6 15 12 9 18" />}
      </svg>
    </button>
  );
}

function MetodoSlide({ item, canLeft, canRight, onPrev, onNext }: {
  item: MenuItem;
  canLeft: boolean;
  canRight: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const hasVideo = Boolean(item.video_url);

  return (
    // Reentra con un desvanecido suave cada vez que cambia el ítem (key en el
    // padre), en vez de saltar de golpe de una foto/texto a otra.
    <div style={{ textAlign: "center", animation: "fadeUp 0.5s ease both" }}>
      {/* Foto/video + flechitas A SUS COSTADOS: fila con las flechas como
          columnas fijas de 40px a cada lado y la imagen centrada entre ellas
          — así las flechas quedan a la altura de la foto, no de todo el
          bloque de texto de abajo. */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
        {canLeft ? <ChevronButton dir="left" onClick={onPrev} /> : <div style={{ flex: "0 0 40px" }} />}

        <div style={{
          position: "relative", width: "58%", maxWidth: 210, aspectRatio: "1/1",
          borderRadius: 18, overflow: "hidden", background: "#1a120c",
          border: "1px solid rgba(217,179,130,0.3)",
          boxShadow: "0 18px 40px -18px rgba(0,0,0,0.65)",
          flexShrink: 0,
        }}>
          {hasVideo ? (
            <video
              src={item.video_url ?? undefined}
              poster={item.video_poster_url ?? item.image_url ?? undefined}
              autoPlay muted loop playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : item.image_url ? (
            <Image src={item.image_url} alt={item.name} fill sizes="210px" style={{ objectFit: "cover" }} />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(244,238,227,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Foto próximamente
            </div>
          )}
          {hasVideo && (
            <span style={{
              position: "absolute", top: 8, left: 8,
              display: "inline-flex", alignItems: "center",
              padding: "3px 8px", borderRadius: 999,
              background: "rgba(0,0,0,0.55)", color: CREAM,
              fontSize: 9, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase",
            }}>
              ▶ Video
            </span>
          )}
        </div>

        {canRight ? <ChevronButton dir="right" onClick={onNext} /> : <div style={{ flex: "0 0 40px" }} />}
      </div>

      {/* Debajo de la foto: nombre, descripción y precio en texto libre. */}
      <div style={{ maxWidth: 320, margin: "18px auto 0" }}>
        <h3 style={{
          fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700,
          fontSize: 24, margin: 0, lineHeight: 1.15, color: GOLD, letterSpacing: "-0.01em",
        }}>
          {item.name}
        </h3>
        {item.description && (
          <p style={{ fontSize: 13.5, fontWeight: 300, lineHeight: 1.65, margin: "10px 0 0", color: "rgba(244,238,227,0.75)" }}>
            {item.description}
          </p>
        )}
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, marginTop: 13, color: CREAM }}>
          {item.price.toLocaleString("es-CO")}
        </div>
      </div>
    </div>
  );
}

export default function HorizontalShowcase({ categoria, onSelect: _onSelect }: {
  categoria: MenuCategory;
  onSelect: (i: MenuItem) => void;
}) {
  const seccion = useRef<HTMLElement>(null);
  const pin = useShowcaseBgPin(seccion);
  const cabecera = useRef<HTMLDivElement>(null);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const el = cabecera.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setHeaderVisible(true);
        io.unobserve(el);
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!categoria.items.length) return null;

  const canLeft  = activeIdx > 0;
  const canRight = activeIdx < categoria.items.length - 1;

  return (
    <section
      ref={seccion}
      // Mismo bleed de borde a borde que las demás secciones oscuras.
      // margin-top 65px (mitad de 130px, a pedido). OJO: la barra de
      // categorías sticky mide ~62px — con 65px, en el peor punto de scroll
      // solo quedan ~3px visibles del margen (ver el mismo problema que ya
      // se dio con 72px). Puede volver a sentirse como que Destacados y
      // Métodos se pegan en cierto punto del scroll.
      // background sólido de base: ver el mismo comentario en
      // VerticalShowcase — cubre el frame de retraso del cálculo de `pin`
      // sin dejar asomar la sección clara vecina (Destacados ya es oscura,
      // pero la que sigue después de Métodos no).
      style={{ position: "relative", margin: "65px -22px 0", background: DARK_BOT }}
    >
      {/* Foto de fondo — mismo comportamiento que Cafés de origen (ver
          useShowcaseBgPin), con la foto del estante de equipos de la barra.
          "corta": esta sección (un solo método a la vez) suele medir menos
          que la pantalla, así que el fondo simplemente cubre el 100% de la
          sección en vez de pinearse (pinear con height:100svh en una sección
          más baja que el viewport hacía que oscilara entre estados en cada
          scroll — el "margen que aparece y desaparece" reportado).
          +120px en "antes"/"después": ver el comentario en VerticalShowcase
          (colchón contra el parpadeo blanco por el frame de retraso del
          scroll listener). */}
      <div
        aria-hidden="true"
        style={{
          position: pin === "durante" ? "fixed" : "absolute",
          top: pin === "despues" ? "auto" : 0,
          bottom: pin === "despues" ? 0 : "auto",
          left: 0, right: 0,
          height: pin === "corta" ? "100%" : pin === "durante" ? "100svh" : "calc(100svh + 120px)",
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(180deg, rgba(20,18,15,0.75) 0%, rgba(20,18,15,0.85) 45%, ${DARK_BOT} 100%), url(/metodos.jpg) center 38%/cover no-repeat`,
            filter: "saturate(0.9) brightness(0.85)",
          }}
        />
        <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 120px 30px ${DARK_BOT}` }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, padding: "40px 22px 60px", borderTop: "1px solid rgba(244,238,227,0.1)" }}>
        <div
          ref={cabecera}
          style={{
            textAlign: "center", marginBottom: 30,
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? "translateY(0)" : "translateY(14px)",
            transition: "opacity .8s ease, transform .8s ease",
          }}
        >
          <h2 style={{
            fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 600,
            fontSize: 25, margin: 0, color: CREAM, letterSpacing: "-0.01em",
          }}>
            {categoria.name}
          </h2>
          <div style={{ width: 34, height: 1, background: GOLD, margin: "13px auto 0" }} />
          {categoria.description && (
            <p style={{
              fontSize: 12.5, fontWeight: 300, lineHeight: 1.6, margin: "13px auto 0",
              maxWidth: 380, color: "rgba(244,238,227,0.6)",
            }}>
              {categoria.description}
            </p>
          )}
        </div>

        {/* Un método a la vez: foto/video con las flechitas a sus costados,
            nombre/descripción/precio debajo. */}
        <MetodoSlide
          key={categoria.items[activeIdx].id}
          item={categoria.items[activeIdx]}
          canLeft={canLeft}
          canRight={canRight}
          onPrev={() => setActiveIdx(i => i - 1)}
          onNext={() => setActiveIdx(i => i + 1)}
        />

        {categoria.items.length > 1 && (
          <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, letterSpacing: "0.14em", color: "rgba(244,238,227,0.45)" }}>
            {activeIdx + 1} / {categoria.items.length}
          </div>
        )}
      </div>
    </section>
  );
}
