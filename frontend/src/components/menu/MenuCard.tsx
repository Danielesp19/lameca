"use client";

import { useEffect, useRef, useState } from "react";
import { MenuItem, caffeineInfo } from "@/lib/menu-api";

// Paleta rediseño v2
const CHOCO = "#3E2A1C";
const TERRA = "#BC5A32";
const CARD  = "#FFFCF5";

// Veces que se reproduce el video en la tarjeta antes de congelarse en el último
// frame. 1 = una pasada y se detiene (ahorra ancho de banda del backend
// single-thread). Vuelve a reproducirse si el usuario interactúa con la tarjeta.
const MAX_LOOPS = 1;

interface Props {
  item: MenuItem;
  isActive: boolean;
  onSelect?: (item: MenuItem) => void;
  /** Bebida caliente → vapor animado cuando la tarjeta está activa */
  hot?: boolean;
  /** Posición en la lista → retraso de la entrada en cascada */
  index?: number;
}

export default function MenuCard({ item, isActive, onSelect, hot = false, index = 0 }: Props) {
  const [imgIdx, setImgIdx] = useState(0);
  const [videoVisible, setVideoVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const loopsRef = useRef(0);

  const hasVideo = Boolean(item.video_url);
  // Si el producto tiene video, la tarjeta muestra SOLO el video (no las fotos).
  const angles = (hasVideo
    ? []
    : [...(item.image_url ? [item.image_url] : []), ...(item.extra_image_urls ?? [])]
  ).filter(Boolean) as string[];

  const isAngles = !hasVideo && angles.length > 1;
  const caffeine = caffeineInfo(item.caffeine_level);

  // El video se carga SOLO cuando la tarjeta llega al centro (isActive): así nunca
  // hay varias descargas compitiendo a la vez (clave con el backend single-thread).
  // Sin precarga: el src se asigna recién al activarse y se reproduce.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !hasVideo) return;
    if (isActive) {
      loopsRef.current = 0;
      if (item.video_url && !v.getAttribute("src")) { v.src = item.video_url; v.load(); }
      v.muted = true;
      v.playbackRate = 0.85;
      v.play().then(() => setVideoVisible(true)).catch(() => {});
    } else {
      v.pause();
      setVideoVisible(false);
    }
  }, [isActive, hasVideo, item.video_url]);

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

  // Angles: loop interval while active
  useEffect(() => {
    if (!isActive || !isAngles || angles.length < 2) {
      setImgIdx(0);
      return;
    }
    let i = 0;
    const t = setInterval(() => {
      i = (i + 1) % angles.length;
      setImgIdx(i);
    }, 1500);
    return () => clearInterval(t);
  }, [isActive, isAngles, angles.length]);

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
      className="menu-card-wrap"
      style={{ animation: `cardIn 0.6s cubic-bezier(0.2,0.7,0.2,1) ${Math.min(index, 8) * 75}ms both` }}
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
      data-id={item.id}
      style={{
        position: "relative",
        display: "flex", flexDirection: "column",
        height: "100%",
        background: CARD,
        cursor: "pointer",
        border: isActive
          ? "1px solid rgba(188,90,50,0.6)"
          : "1px solid rgba(188,90,50,0.32)",
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: isActive
          ? "0 24px 55px -20px rgba(188,90,50,0.5), inset 0 0 0 1px rgba(188,90,50,0.25)"
          : "0 14px 28px -22px rgba(62,42,28,0.55)",
        transformOrigin: "center center",
        willChange: "transform, opacity",
        transition: "box-shadow .5s ease, border-color .5s ease",
      }}
    >
      {/* ── Media ── */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "1/0.82", overflow: "hidden", background: "#EFE4D2" }}>
        {/* Angle layers (cover is index 0) — zoom lento tipo Ken Burns al activarse */}
        {angles.length > 0 ? (
          angles.map((src, i) => (
            <div
              key={i}
              style={{
                position: "absolute", inset: 0,
                backgroundImage: `url('${src}')`,
                backgroundSize: "cover", backgroundPosition: "center",
                opacity: i === imgIdx ? 1 : 0,
                transform: isActive ? "scale(1.08)" : "scale(1)",
                transition: "opacity 0.7s ease, transform 2.2s cubic-bezier(0.2,0.6,0.3,1)",
              }}
            />
          ))
        ) : hasVideo ? (
          /* Fondo mientras el video bufferea (lo tapa al reproducirse) */
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(145deg,#EFE4D2 0%,#E2D3BC 100%)" }} />
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
              objectFit: "cover",
              opacity: videoVisible ? 1 : 0,
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

        {/* Vapor de café — solo bebidas calientes, se enciende al centrarse */}
        {hot && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute", top: 0, left: 0, right: 0, height: "55%",
              opacity: isActive ? 1 : 0,
              transition: "opacity .9s ease",
              pointerEvents: "none",
              mixBlendMode: "screen",
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
            background: "rgba(62,42,28,0.55)",
            backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
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
              background: "rgba(62,42,28,0.55)",
              backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
              color: "#F7F1E5", fontSize: 10, fontWeight: 500,
              animation: "badgeIn 0.5s ease 0.4s both",
            }}
          >
            <span style={{ letterSpacing: caffeine.beans > 1 ? "-2px" : 0 }}>{caffeine.emoji}</span>
          </span>
        )}
      </div>

      {/* ── Content ── */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "11px 13px 12px" }}>
        <h3 style={{
          fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 600,
          fontSize: 19, margin: 0, lineHeight: 1.05, color: TERRA,
        }}>
          {item.name}
        </h3>

        {item.description && (
          <p style={{
            fontSize: 11.5, fontWeight: 300, lineHeight: 1.45,
            opacity: 0.62, margin: "5px 0 0", flex: 1, color: CHOCO,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
          }}>
            {item.description}
          </p>
        )}

        {/* Precio + "Ver más →" en una sola fila (estilo del diseño, sin alargar) */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 10 }}>
          <span style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 20, color: CHOCO }}>
            ${item.price.toLocaleString("es-CO")}
          </span>
          <span
            aria-hidden="true"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 13px", borderRadius: 999,
              border: `1px solid ${isActive ? CHOCO : "rgba(62,42,28,0.35)"}`,
              background: isActive ? CHOCO : "transparent",
              color: isActive ? "#F7F1E5" : CHOCO,
              fontFamily: "var(--font-sans)", fontSize: 10.5, fontWeight: 500,
              letterSpacing: "0.09em", textTransform: "uppercase",
              transition: "all .35s ease", whiteSpace: "nowrap",
            }}
          >
            Ver más →
          </span>
        </div>
      </div>
    </article>
    </div>
  );
}
