"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MenuCategory, MenuItem } from "@/lib/menu-api";
import { useShowcaseBgPin } from "./useShowcaseBgPin";

// Misma paleta oscura de Destacados y del modal "Nuestras sedes".
const DARK_BOT = "#0d0805";
const CREAM    = "#F4EEE3";
const GOLD     = "#C9A87E";

/**
 * Observer único compartido por todas las filas — mismo patrón que MenuCard:
 * una fila = un observer sería un observer por café, para nada.
 *
 * Cada fila se revela UNA sola vez y se deja de observar: re-animar al subir y
 * bajar marea. El umbral bajo (12%) dispara cuando asoma el borde superior, que
 * es cuando el ojo ya la está buscando.
 */
let obs: IntersectionObserver | null = null;
const callbacks = new WeakMap<Element, () => void>();

/**
 * Banda de revelado: los márgenes negativos recortan el viewport por arriba y
 * por abajo, así una fila no cuenta como visible hasta que entra en la franja
 * central. Sin esto, en una pantalla alta entran tres o cuatro filas a la vez y
 * el observer las dispara todas juntas.
 */
function observe(el: Element, onReveal: () => void): () => void {
  if (typeof IntersectionObserver === "undefined") {
    onReveal(); // sin soporte: se muestra sin animación, nunca invisible
    return () => {};
  }
  if (!obs) {
    obs = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          callbacks.get(e.target)?.();
          callbacks.delete(e.target);
          obs!.unobserve(e.target);
        }
      },
      { rootMargin: "-12% 0px -26% 0px", threshold: 0.2 },
    );
  }
  callbacks.set(el, onReveal);
  obs.observe(el);
  return () => {
    callbacks.delete(el);
    obs?.unobserve(el);
  };
}

/**
 * Cola de apariciones: aunque el observer entregue varias filas en el mismo
 * lote (scroll rápido, pantalla de escritorio muy alta), se revelan separadas
 * en el tiempo — una detrás de otra, nunca en bloque.
 *
 * Es una marca de tiempo, no un contador: se autorregula sola. Si pasas un rato
 * sin revelar nada, la siguiente entra al instante en vez de arrastrar un
 * retraso acumulado.
 */
const SEPARACION = 150; // ms entre una aparición y la siguiente
let proximaLibre = 0;

function encolarAparicion(revelar: () => void): () => void {
  const ahora = typeof performance !== "undefined" ? performance.now() : Date.now();
  const cuando = Math.max(ahora, proximaLibre);
  proximaLibre = cuando + SEPARACION;

  const espera = cuando - ahora;
  if (espera <= 0) {
    revelar();
    return () => {};
  }
  const t = window.setTimeout(revelar, espera);
  return () => clearTimeout(t);
}

function Fila({ item, invertida, onSelect }: {
  item: MenuItem;
  invertida: boolean;
  onSelect: (i: MenuItem) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelarCola = () => {};
    const dejarDeObservar = observe(el, () => {
      cancelarCola = encolarAparicion(() => setVisible(true));
    });
    return () => { dejarDeObservar(); cancelarCola(); };
  }, []);

  // La foto entra primero y el texto la sigue: ese desfase es lo que da la
  // sensación de aparición "fantasma" en vez de un bloque que salta de golpe.
  const foto  = { animation: visible ? "ghostIn 0.85s cubic-bezier(0.2,0.7,0.2,1) both" : undefined };
  const texto = { animation: visible ? "ghostIn 0.85s cubic-bezier(0.2,0.7,0.2,1) 0.14s both" : undefined };

  return (
    <div
      ref={ref}
      style={{
        display: "flex",
        flexDirection: invertida ? "row-reverse" : "row",
        alignItems: "center",
        gap: 20,
        // Mucho aire entre filas, a propósito: si caben varias en pantalla
        // aparecen juntas y se pierde la sensación de ir descubriéndolas una a
        // una al bajar. Con este alto, en un celular solo cabe una en la banda
        // de revelado.
        padding: "52px 0",
        opacity: visible ? 1 : 0,
      }}
    >
      <div style={{ flex: "0 0 42%", maxWidth: 230, ...foto }}>
        <button
          type="button"
          onClick={() => onSelect(item)}
          style={{
            display: "block", width: "100%", aspectRatio: "1/1", padding: 0,
            border: "none", borderRadius: 14, overflow: "hidden", cursor: "pointer",
            background: "rgba(244,238,227,0.06)",
          }}
        >
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.name}
              width={400}
              height={400}
              // lazy a propósito: esta sección vive al final de la página y sus
              // fotos no deben competir con la carga inicial del menú.
              loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : null}
        </button>
      </div>

      <div style={{ flex: 1, minWidth: 0, textAlign: invertida ? "right" : "left", ...texto }}>
        <h3 style={{
          fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700,
          fontSize: 19, margin: 0, lineHeight: 1.15, color: GOLD, letterSpacing: "-0.01em",
        }}>
          {item.name}
        </h3>
        {item.description && (
          <p style={{
            fontSize: 12.5, fontWeight: 300, lineHeight: 1.5, margin: "7px 0 0",
            color: "rgba(244,238,227,0.66)",
          }}>
            {item.description}
          </p>
        )}
        <div style={{
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17,
          color: CREAM, marginTop: 9,
        }}>
          {item.price.toLocaleString("es-CO")}
        </div>
      </div>
    </div>
  );
}

export default function VerticalShowcase({ categoria, onSelect }: {
  categoria: MenuCategory;
  onSelect: (i: MenuItem) => void;
}) {
  const seccion = useRef<HTMLElement>(null);
  const cabecera = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const pin = useShowcaseBgPin(seccion);

  useEffect(() => {
    const el = cabecera.current;
    if (!el) return;
    return observe(el, () => setVisible(true));
  }, []);

  if (!categoria.items.length) return null;

  return (
    <section
      ref={seccion}
      // El margen negativo lleva el fondo de borde a borde en celular, igual
      // que hace Destacados. margin-top 130px (no 34px): la barra de chips es
      // sticky y mide ~62px — con un margen apenas un poco más alto que la
      // barra (72px probado), en el peor punto de scroll solo asoman ~10px,
      // casi imperceptibles. Con 130px quedan siempre ~68px cómodamente
      // visibles por debajo de la barra, sin importar el punto de scroll.
      style={{ position: "relative", margin: "130px -22px 0" }}
    >
      {/* Foto de fondo a pantalla completa, pineada durante TODA la sección
          — nunca cae a un color plano, siempre es la foto. "corta": si la
          sección midiera menos que el viewport (pocos ítems), cubre el 100%
          de la sección en vez de pinear — ver el comentario en HorizontalShowcase. */}
      <div
        aria-hidden="true"
        style={{
          position: pin === "durante" ? "fixed" : "absolute",
          top: pin === "despues" ? "auto" : 0,
          bottom: pin === "despues" ? 0 : "auto",
          left: 0, right: 0,
          height: pin === "corta" ? "100%" : "100svh",
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(180deg, rgba(20,18,15,0.82) 0%, rgba(20,18,15,0.88) 40%, ${DARK_BOT} 100%), url(/image.png) center/cover no-repeat`,
            filter: "grayscale(0.3) saturate(0.85) brightness(0.85)",
          }}
        />
        <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 120px 30px ${DARK_BOT}` }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, padding: "40px 22px 54px", borderTop: "1px solid rgba(244,238,227,0.1)" }}>
        <div
          ref={cabecera}
          style={{
            textAlign: "center",
            marginBottom: 10,
            animation: visible ? "ghostIn 0.9s cubic-bezier(0.2,0.7,0.2,1) both" : undefined,
            opacity: visible ? 1 : 0,
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

        {categoria.items.map((item, i) => (
          <Fila key={item.id} item={item} invertida={i % 2 === 1} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}
