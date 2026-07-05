"use client";

import { memo, useEffect, useRef, useState } from "react";
import { MenuItem, caffeineInfo } from "@/lib/menu-api";

// Paleta rediseño v2
const CHOCO = "#3E2A1C";
const TERRA = "#BC5A32";
const CARD  = "#FFFCF5";

// Veces que se reproduce el video en la tarjeta antes de congelarse en el último
// frame. 1 = una pasada y se detiene (ahorra ancho de banda del backend
// single-thread). Vuelve a reproducirse si el usuario interactúa con la tarjeta.
const MAX_LOOPS = 1;

// ── Prefetch por cercanía ─────────────────────────────────────────────────────
// Un único IntersectionObserver compartido marca cada tarjeta como "cercana"
// cuando entra en un viewport ampliado (~1.6 pantallas en horizontal, para los
// carruseles, y ~0.8 en vertical). Al acercarse se fuerza la descarga de sus
// imágenes y de los metadatos del video, así ya están listos aunque el usuario
// scrollee rápido. Es one-shot: una vez cercana, deja de observarse.
const NEAR_MARGIN = "80% 160% 80% 160%";
let nearObs: IntersectionObserver | null = null;
const nearCbs = new Map<Element, () => void>();

function watchNear(el: Element, cb: () => void): () => void {
  if (typeof IntersectionObserver === "undefined") { cb(); return () => {}; }
  if (!nearObs) {
    nearObs = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        nearCbs.get(e.target)?.();
        nearObs?.unobserve(e.target);
        nearCbs.delete(e.target);
      }
    }, { rootMargin: NEAR_MARGIN });
  }
  nearCbs.set(el, cb);
  nearObs.observe(el);
  return () => { nearObs?.unobserve(el); nearCbs.delete(el); };
}

interface Props {
  item: MenuItem;
  isActive: boolean;
  onSelect?: (item: MenuItem) => void;
  /** Clave única por instancia (categoría:producto) — un mismo producto puede
   *  aparecer en dos filas y solo debe activarse la copia centrada. */
  cardKey?: string;
  /** Bebida caliente → vapor animado cuando la tarjeta está activa */
  hot?: boolean;
  /** Posición en la lista → retraso de la entrada en cascada */
  index?: number;
}

// memo: al cambiar la tarjeta activa durante el scroll, React solo re-renderiza
// las 2 tarjetas afectadas en vez de todas las del menú (jank en gamas bajas).
export default memo(MenuCard);

function MenuCard({ item, isActive, onSelect, cardKey, hot = false, index = 0 }: Props) {
  const [imgIdx, setImgIdx] = useState(0);
  const [videoVisible, setVideoVisible] = useState(false);
  // "Cercana" al viewport (con margen): dispara la pre-descarga de su media.
  const [near, setNear] = useState(false);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const stripRaf = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const loopsRef = useRef(0);

  const hasVideo = Boolean(item.video_url);
  // Si el producto tiene video, la tarjeta muestra SOLO el video (no cicla fotos),
  // pero usa una miniatura mientras el video no corre: la foto del producto o, si
  // no hay, el poster JPEG que el backend genera del primer frame. Solo sin
  // ninguno de los dos se cae a cargar los metadatos del video.
  const poster = hasVideo ? (item.image_url ?? item.video_poster_url ?? null) : null;
  const angles = (hasVideo
    ? []
    : [...(item.image_url ? [item.image_url] : []), ...(item.extra_image_urls ?? [])]
  ).filter(Boolean) as string[];

  const caffeine = caffeineInfo(item.caffeine_level);

  // Marca la tarjeta como cercana cuando entra al viewport ampliado.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    return watchNear(el, () => setNear(true));
  }, []);

  // El video se carga SOLO cuando la tarjeta llega al centro (isActive): así nunca
  // hay varias descargas compitiendo a la vez (clave con el backend single-thread).
  // Sin precarga: el src se asigna recién al activarse y se reproduce.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !hasVideo) return;
    if (isActive) {
      // Pequeña espera: si el usuario pasa volando por la tarjeta durante el
      // scroll, no dispara descarga/decodificación del video para nada.
      const t = setTimeout(() => {
        loopsRef.current = 0;
        if (item.video_url && !v.getAttribute("src")) { v.src = item.video_url; v.load(); }
        v.muted = true;
        v.playbackRate = 0.85;
        v.play().then(() => setVideoVisible(true)).catch(() => {});
      }, 230);
      return () => clearTimeout(t);
    } else {
      v.pause();
      setVideoVisible(false);
    }
  }, [isActive, hasVideo, item.video_url]);

  // Al acercarse la tarjeta, el video precarga SOLO sus metadatos (unos KB):
  // el primer frame y la duración quedan listos y el play al centrarse arranca
  // al instante. La descarga completa sigue ocurriendo solo al activarse, así
  // nunca hay varios videos bajando enteros a la vez.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !hasVideo || !near) return;
    if (!v.getAttribute("src") && item.video_url) {
      v.preload = "metadata";
      v.src = item.video_url;
      if (!poster) {
        // Sin foto de producto, el primer frame pausado hace de miniatura.
        const onMeta = () => { try { v.currentTime = 0.05; } catch { /* noop */ } };
        v.addEventListener("loadedmetadata", onMeta, { once: true });
        return () => v.removeEventListener("loadedmetadata", onMeta);
      }
    }
  }, [near, hasVideo, poster, item.video_url]);

  // Reproduce solo MAX_LOOPS veces y se congela en el último frame. Cuenta desde 0
  // cada vez que la tarjeta se reactiva.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !hasVideo) return;
    const onEnded = () => {
      loopsRef.current += 1;
      if (loopsRef.current < MAX_LOOPS) {
        v.currentTime = 0;
        v.play().catch(() => {});
      }
    };
    v.addEventListener("ended", onEnded);
    return () => v.removeEventListener("ended", onEnded);
  }, [hasVideo]);

  // Swipe de imágenes: el índice del punto activo sigue al scroll del strip.
  // (El ciclo automático se reemplazó por deslizamiento táctil — feedback del
  // cliente: la navegación entre fotos debe ser manual e intuitiva.)
  function onStripScroll() {
    if (stripRaf.current) return;
    stripRaf.current = requestAnimationFrame(() => {
      stripRaf.current = null;
      const s = stripRef.current;
      if (!s) return;
      setImgIdx(Math.round(s.scrollLeft / Math.max(1, s.clientWidth)));
    });
  }
  useEffect(() => () => { if (stripRaf.current) cancelAnimationFrame(stripRaf.current); }, []);

  // Si el usuario interactúa con la tarjeta (mueve el puntero/hover) y el video ya
  // terminó su pasada, lo reproduce de nuevo. En móvil el re-scroll ya lo reactiva.
  function replayVideo() {
    const v = videoRef.current;
    if (!v || !hasVideo) return;
    if (v.paused || v.ended) {
      loopsRef.current = 0;
      v.currentTime = 0;
      v.muted = true;
      v.play().then(() => setVideoVisible(true)).catch(() => {});
    }
  }

  return (
    // Wrapper: entrada en cascada + feedback táctil. La animación se retira al
    // terminar para no pelear con el :active del CSS ni el tilt del motor 3D.
    <div
      ref={wrapRef}
      className="menu-card-wrap"
      style={{
        animation: `cardIn 0.6s cubic-bezier(0.2,0.7,0.2,1) ${Math.min(index, 8) * 60}ms both`,
        minWidth: 0,
      }}
      onAnimationEnd={e => { if (e.animationName === "cardIn") e.currentTarget.style.animation = "none"; }}
    >
    <article
      onPointerEnter={replayVideo}
      onPointerMove={replayVideo}
      onClick={() => onSelect?.(item)}
      onKeyDown={e => e.key === "Enter" && onSelect?.(item)}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalles de ${item.name}`}
      data-card=""
      data-key={cardKey ?? String(item.id)}
      data-video={hasVideo ? "" : undefined}
      style={{
        position: "relative",
        display: "flex", flexDirection: "column",
        height: "100%",
        background: CARD,
        cursor: "pointer",
        border: isActive
          ? "1.5px solid rgba(188,90,50,0.65)"
          : "1.5px solid rgba(188,90,50,0.28)",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: isActive
          ? "0 24px 55px -20px rgba(188,90,50,0.5), inset 0 0 0 1px rgba(188,90,50,0.25)"
          : "0 14px 28px -22px rgba(62,42,28,0.55)",
        transformOrigin: "center center",
        // Realce sutil por CSS (compositor) — sin tilt por-frame desde JS
        transform: isActive ? "scale(1.02)" : "scale(1)",
        transition: "transform .5s cubic-bezier(0.2,0.7,0.2,1), box-shadow .5s ease, border-color .5s ease",
      }}
    >
      {/* ── Media ── */}
      {/* Cuadrada y compacta para la grilla de 2 columnas */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", overflow: "hidden", background: "#EFE4D2" }}>
        {/* Fotos con SWIPE táctil: strip horizontal con snap — el usuario
            desliza con el dedo para ver más ángulos desde la tarjeta. Lejos
            del viewport solo existe la portada en lazy; al acercarse se montan
            todos los ángulos en eager (prefetch por cercanía). */}
        {angles.length > 0 ? (
          <>
            <div
              ref={stripRef}
              className="cat-scroll"
              onScroll={onStripScroll}
              style={{
                position: "absolute", inset: 0,
                display: "flex",
                overflowX: angles.length > 1 ? "auto" : "hidden",
                scrollSnapType: "x mandatory",
                overscrollBehaviorX: "contain",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {(near ? angles : angles.slice(0, 1)).map((src, i) => (
                <div key={i} style={{ flex: "0 0 100%", height: "100%", overflow: "hidden", scrollSnapAlign: "start" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    loading={near ? "eager" : "lazy"}
                    decoding="async"
                    draggable={false}
                    style={{
                      width: "100%", height: "100%", objectFit: "cover", display: "block",
                      transform: isActive ? "scale(1.06)" : "scale(1)",
                      transition: "transform 2.2s cubic-bezier(0.2,0.6,0.3,1)",
                    }}
                  />
                </div>
              ))}
            </div>
            {/* Puntos indicadores: muestran cuántas fotos hay y cuál se ve */}
            {angles.length > 1 && (
              <div
                aria-hidden="true"
                style={{
                  position: "absolute", bottom: 8, left: 0, right: 0, zIndex: 2,
                  display: "flex", justifyContent: "center", gap: 5,
                  pointerEvents: "none",
                }}
              >
                {angles.map((_, i) => (
                  <span
                    key={i}
                    style={{
                      width: i === imgIdx ? 16 : 5, height: 5, borderRadius: 3,
                      background: i === imgIdx ? "#F7F1E5" : "rgba(247,241,229,0.55)",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
                      transition: "all .3s ease",
                    }}
                  />
                ))}
              </div>
            )}
          </>
        ) : hasVideo ? (
          /* Miniatura del video: foto del producto (o el primer frame del video
             pausado si no hay foto). El video la tapa al reproducirse. */
          poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={poster}
              alt=""
              loading={near ? "eager" : "lazy"}
              decoding="async"
              draggable={false}
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%", objectFit: "cover",
                transform: isActive ? "scale(1.08)" : "scale(1)",
                transition: "transform 2.2s cubic-bezier(0.2,0.6,0.3,1)",
              }}
            />
          ) : (
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(145deg,#EFE4D2 0%,#E2D3BC 100%)" }} />
          )
        ) : (
          /* Placeholder for products without image */
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(145deg, #EFE4D2 0%, #E2D3BC 100%)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <svg width="40" height="40" viewBox="0 0 48 48" fill="none" aria-hidden="true" style={{ animation: "gentleFloat 4.5s ease-in-out infinite" }}>
              <path d="M10 36h28M14 36V22a10 10 0 0 1 20 0v14" stroke="#B8A084" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M34 22c2 0 6 .5 6 4s-4 4-6 4" stroke="#B8A084" strokeWidth="1.8" strokeLinecap="round"/>
              <ellipse cx="24" cy="38" rx="12" ry="2" fill="#B8A084" opacity=".3"/>
            </svg>
            <span style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#A08A6E", opacity: 0.8 }}>
              Foto próximamente
            </span>
          </div>
        )}

        {/* Video overlay */}
        {hasVideo && (
          <video
            ref={videoRef}
            muted playsInline preload="none" aria-hidden="true"
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              // "contain": respeta las proporciones originales del video sin
              // recortarlo (feedback: los videos se veían mutilados/fuera de escala)
              objectFit: "contain",
              // Sin póster, el video mismo (primer frame pausado) es la miniatura
              opacity: videoVisible || !poster ? 1 : 0,
              transition: "opacity 0.6s ease",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Bottom gradient */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0) 62%, rgba(62,42,28,0.32) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Vapor de café — solo bebidas calientes y SOLO montado en la tarjeta
            activa: si estuviera siempre, cada tarjeta caliente tendría 3 blurs
            animándose infinitamente aunque no se vean. Los wisps ya nacen con
            opacidad 0 en su keyframe, así que aparecen suave igual. */}
        {hot && isActive && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute", top: 0, left: 0, right: 0, height: "55%",
              pointerEvents: "none",
            }}
          >
            <span className="wisp" style={{ left: "36%", animationDuration: "3.4s" }} />
            <span className="wisp" style={{ left: "50%", height: 48, animationDuration: "4.2s", animationDelay: "0.7s" }} />
            <span className="wisp" style={{ left: "64%", animationDuration: "3.8s", animationDelay: "1.4s" }} />
          </div>
        )}

        {/* Badge — solo video */}
        {hasVideo && (
          <span style={{
            position: "absolute", top: 10, left: 10, zIndex: 2,
            display: "inline-flex", alignItems: "center",
            padding: "4px 9px", borderRadius: 999,
            background: "rgba(62,42,28,0.68)",
            color: "#F7F1E5", fontSize: 9, fontWeight: 500,
            letterSpacing: "0.14em", textTransform: "uppercase",
            animation: "badgeIn 0.5s ease 0.3s both",
          }}>
            ▶ Video
          </span>
        )}

        {/* Caffeine badge (top-right) */}
        {caffeine && (
          <span
            title={caffeine.label}
            style={{
              position: "absolute", top: 10, right: 10, zIndex: 2,
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "4px 9px", borderRadius: 999,
              background: "rgba(62,42,28,0.68)",
              color: "#F7F1E5", fontSize: 10, fontWeight: 500,
              animation: "badgeIn 0.5s ease 0.4s both",
            }}
          >
            <span style={{ letterSpacing: caffeine.beans > 1 ? "-2px" : 0 }}>{caffeine.emoji}</span>
          </span>
        )}
      </div>

      {/* ── Content ── (compacto: 2 tarjetas por fila) */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "9px 11px 11px" }}>
        <h3 style={{
          fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700,
          fontSize: 16.5, margin: 0, lineHeight: 1.15, color: TERRA,
          letterSpacing: "-0.01em",
        }}>
          {item.name}
        </h3>

        {item.description && (
          <p style={{
            fontSize: 11.5, fontWeight: 300, lineHeight: 1.4,
            margin: "4px 0 0", flex: 1, color: "rgba(62,42,28,0.68)",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
          }}>
            {item.description}
          </p>
        )}

        {/* Fila de precio con etiqueta + "Ver más →" abajo, como el diseño */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
          <span style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(62,42,28,0.5)" }}>
            Precio
          </span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: CHOCO, letterSpacing: "-0.01em" }}>
            ${item.price.toLocaleString("es-CO")}
          </span>
        </div>

        <span
          aria-hidden="true"
          style={{
            marginTop: 9, alignSelf: "flex-start",
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "6px 12px", borderRadius: 999,
            border: `1px solid ${isActive ? CHOCO : "rgba(62,42,28,0.35)"}`,
            background: isActive ? CHOCO : "transparent",
            color: isActive ? "#F7F1E5" : CHOCO,
            fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 500,
            letterSpacing: "0.09em", textTransform: "uppercase",
            transition: "all .35s ease", whiteSpace: "nowrap",
          }}
        >
          Ver más →
        </span>
      </div>
    </article>
    </div>
  );
}
