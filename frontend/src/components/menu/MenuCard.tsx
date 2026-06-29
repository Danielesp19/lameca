"use client";

import { useEffect, useRef, useState } from "react";
import { MenuItem, caffeineInfo } from "@/lib/menu-api";

const ACCENT = "#E8A33D";

interface Props {
  item: MenuItem;
  isActive: boolean;
  onSelect?: (item: MenuItem) => void;
  highlight?: boolean;
}

export default function MenuCard({ item, isActive, onSelect, highlight = false }: Props) {
  const [imgIdx, setImgIdx] = useState(0);
  const [videoVisible, setVideoVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const angles = [
    ...(item.image_url ? [item.image_url] : []),
    ...(item.extra_image_urls ?? []),
  ].filter(Boolean) as string[];

  const hasVideo = Boolean(item.video_url);
  const isAngles = !hasVideo && angles.length > 1;
  const badge = hasVideo ? "▶ Video" : isAngles ? "360°" : null;
  const caffeine = caffeineInfo(item.caffeine_level);

  // Video: lazy-load src, play/pause on isActive
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !hasVideo) return;
    if (isActive) {
      if (item.video_url && !v.src) v.src = item.video_url;
      v.muted = true;
      v.playbackRate = 0.85;
      const p = v.play();
      if (p) p.then(() => setVideoVisible(true)).catch(() => {});
      else setVideoVisible(true);
    } else {
      v.pause();
      setVideoVisible(false);
    }
  }, [isActive, hasVideo, item.video_url]);

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

  return (
    <article
      data-card=""
      data-id={item.id}
      style={{
        background: "#1C1714",
        border: highlight ? `1.5px solid ${ACCENT}` : "1px solid rgba(242,235,227,0.09)",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: highlight
          ? `0 18px 40px -22px rgba(0,0,0,0.8), 0 0 0 1px ${ACCENT}33, 0 0 30px -6px ${ACCENT}55`
          : "0 16px 34px -24px rgba(0,0,0,0.8)",
      }}
    >
      {/* ── Media ── */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", overflow: "hidden", background: "#E8DFCF" }}>
        {/* Angle layers (cover is index 0) */}
        {angles.length > 0 ? (
          angles.map((src, i) => (
            <div
              key={i}
              style={{
                position: "absolute", inset: 0,
                backgroundImage: `url('${src}')`,
                backgroundSize: "cover", backgroundPosition: "center",
                opacity: i === imgIdx ? 1 : 0,
                transition: "opacity 0.7s ease",
              }}
            />
          ))
        ) : (
          /* Placeholder for products without image */
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(145deg, #E8DFCF 0%, #D9CDB8 100%)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 10,
          }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <path d="M10 36h28M14 36V22a10 10 0 0 1 20 0v14" stroke="#B8A898" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M34 22c2 0 6 .5 6 4s-4 4-6 4" stroke="#B8A898" strokeWidth="1.8" strokeLinecap="round"/>
              <ellipse cx="24" cy="38" rx="12" ry="2" fill="#B8A898" opacity=".3"/>
            </svg>
            <span style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#A89880", opacity: 0.7 }}>
              Foto próximamente
            </span>
          </div>
        )}

        {/* Video overlay */}
        {hasVideo && (
          <video
            ref={videoRef}
            muted playsInline loop preload="none" aria-hidden="true"
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
            background: "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(20,12,7,0.5) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Badge */}
        {badge && (
          <span style={{
            position: "absolute", top: 12, left: 12, zIndex: 2,
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 11px", borderRadius: 999,
            background: "rgba(20,12,7,0.55)",
            backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
            color: "#F2EBE3", fontSize: 10, fontWeight: 500,
            letterSpacing: "0.14em", textTransform: "uppercase",
          }}>
            {badge}
          </span>
        )}

        {/* Caffeine badge (top-right) */}
        {caffeine && (
          <span
            title={caffeine.label}
            style={{
              position: "absolute", top: 12, right: 12, zIndex: 2,
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "5px 10px", borderRadius: 999,
              background: "rgba(20,12,7,0.55)",
              backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
              color: "#F2EBE3", fontSize: 11, fontWeight: 500,
            }}
          >
            <span style={{ letterSpacing: caffeine.beans > 1 ? "-2px" : 0 }}>{caffeine.emoji}</span>
          </span>
        )}
      </div>

      {/* ── Content ── */}
      <div style={{ display: "flex", flexDirection: "column", padding: "16px 17px 17px" }}>
        {highlight && (
          <span style={{
            alignSelf: "flex-start", marginBottom: 9,
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 11px", borderRadius: 999,
            background: `${ACCENT}1F`, border: `1px solid ${ACCENT}66`,
            color: ACCENT, fontSize: 10, fontWeight: 700,
            letterSpacing: "0.16em", textTransform: "uppercase",
          }}>
            ★ Promo del día
          </span>
        )}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
          <h3 style={{
            fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 17,
            margin: 0, letterSpacing: "0.01em", color: "#F2EBE3",
          }}>
            {item.name}
          </h3>
          <span style={{
            fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 23,
            whiteSpace: "nowrap", color: "#F2EBE3",
          }}>
            ${item.price.toLocaleString("es-CO")}
          </span>
        </div>

        {item.description && (
          <p style={{
            fontSize: 13, fontWeight: 300, lineHeight: 1.5,
            opacity: 0.6, margin: "7px 0 0", color: "#F2EBE3",
          }}>
            {item.description}
          </p>
        )}

        <button
          onClick={() => onSelect?.(item)}
          style={{
            marginTop: 15, alignSelf: "flex-start",
            display: "inline-flex", alignItems: "center", gap: 9,
            padding: "11px 20px", borderRadius: 999,
            border: "1px solid rgba(242,235,227,0.5)", background: "transparent",
            color: "#F2EBE3", fontFamily: "var(--font-sans)",
            fontSize: 12.5, fontWeight: 500, letterSpacing: "0.1em",
            textTransform: "uppercase", cursor: "pointer",
            transition: "all .2s",
          }}
          onMouseEnter={e => { const t = e.currentTarget; t.style.background = "#F2EBE3"; t.style.color = "#0A0A0A"; }}
          onMouseLeave={e => { const t = e.currentTarget; t.style.background = "transparent"; t.style.color = "#F2EBE3"; }}
        >
          Ver más <span style={{ fontSize: 15 }}>→</span>
        </button>
      </div>
    </article>
  );
}
