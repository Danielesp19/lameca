"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MenuItem } from "@/lib/menu-api";

const ACCENT = "#C8A97E";

interface Props {
  item: MenuItem;
  index: number;
  onSelect?: (item: MenuItem) => void;
}

const visible = { opacity: 1, rotateY: 0, rotateX: 0, scale: 1 };
const hidden  = { opacity: 0, rotateY: 22, rotateX: 8, scale: 0.9 };

export default function MenuCard({ item, index, onSelect }: Props) {
  const [hovered,  setHovered]  = useState(false);
  const [imgIdx,   setImgIdx]   = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const inView   = useInView(wrapRef, { once: true, margin: "-64px" });

  // Images for 3-angle cycling: main + up to 2 extras
  const angles = [
    ...(item.image_url ? [item.image_url] : []),
    ...(item.extra_image_urls?.slice(0, 2) ?? []),
  ].filter(Boolean) as string[];

  const hasGif   = Boolean(item.gif_url);
  const hasVideo = Boolean(item.video_url);
  const showAnim = hovered && (hasGif || hasVideo);

  // When card enters view, cycle through the angle images once
  useEffect(() => {
    if (!inView || angles.length < 2) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    let idx = 0;

    const step = () => {
      idx++;
      if (idx >= angles.length) return;
      setImgIdx(idx);
      if (idx < angles.length - 1) {
        timers.push(setTimeout(step, 900));
      } else {
        // Return to first angle after showing all
        timers.push(setTimeout(() => setImgIdx(0), 1100));
      }
    };

    timers.push(setTimeout(step, 550));
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  function onEnter() {
    setHovered(true);
    videoRef.current?.play().catch(() => {});
  }
  function onLeave() {
    setHovered(false);
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; }
  }

  const currentImg = angles[imgIdx] ?? null;

  return (
    <div ref={wrapRef} style={{ perspective: "900px" }}>
      <motion.article
        initial={hidden}
        animate={inView ? visible : hidden}
        transition={{ duration: 0.75, delay: Math.min(index, 6) * 0.07, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ y: -6, boxShadow: "0 28px 52px -18px rgba(36,26,18,0.38)" }}
        whileTap={{ scale: 0.97 }}
        style={{
          display: "flex", flexDirection: "column",
          background: "#FFFDF9",
          border: "1px solid rgba(36,26,18,0.08)",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 14px 30px -22px rgba(36,26,18,0.5)",
          cursor: "pointer",
        }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onClick={() => onSelect?.(item)}
        onKeyDown={e => e.key === "Enter" && onSelect?.(item)}
        tabIndex={0}
        role="button"
        aria-label={`Ver detalles de ${item.name}`}
      >
        {/* ── Image area ── */}
        <div style={{
          position: "relative",
          height: "clamp(150px,20vw,186px)",
          overflow: "hidden",
          background: "repeating-linear-gradient(45deg,#E8DFCF 0,#E8DFCF 11px,#EEE7D9 11px,#EEE7D9 22px)",
        }}>
          {/* Main/angle image — crossfades between indices */}
          {currentImg && !showAnim && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={imgIdx}
              src={currentImg}
              alt={item.name}
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%",
                objectFit: "cover",
                animation: "imgFadeIn 0.38s ease both",
                transform: hovered ? "scale(1.05)" : "scale(1)",
                transition: "transform 600ms ease",
              }}
            />
          )}

          {/* GIF on hover */}
          {hasGif && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.gif_url!} alt="" aria-hidden="true"
              style={{
                position: "absolute", inset: 0, width: "100%", height: "100%",
                objectFit: "cover",
                opacity: hovered ? 1 : 0,
                transition: "opacity 250ms ease",
              }}
            />
          )}

          {/* MP4 on hover */}
          {hasVideo && (
            <video
              ref={videoRef} src={item.video_url!} loop muted playsInline aria-hidden="true"
              style={{
                position: "absolute", inset: 0, width: "100%", height: "100%",
                objectFit: "cover",
                opacity: hovered ? 1 : 0,
                transition: "opacity 250ms ease",
              }}
            />
          )}

          {/* Featured badge */}
          {item.is_featured && (
            <span style={{
              position: "absolute", top: 12, left: 12, zIndex: 1,
              fontSize: 10, letterSpacing: "0.08em",
              color: "rgba(36,26,18,0.6)",
              background: "rgba(255,253,249,0.9)",
              padding: "4px 9px", borderRadius: 6,
            }}>
              Destacado
            </span>
          )}

          {/* Angle indicator dots */}
          {angles.length > 1 && (
            <div style={{
              position: "absolute", bottom: 9, left: "50%",
              transform: "translateX(-50%)",
              display: "flex", gap: 5, zIndex: 2,
            }}>
              {angles.map((_, i) => (
                <span key={i} style={{
                  width: 5, height: 5, borderRadius: "50%", display: "block",
                  background: i === imgIdx ? ACCENT : "rgba(255,253,249,0.65)",
                  transition: "background 300ms",
                }} />
              ))}
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "clamp(15px,1.6vw,20px)" }}>
          <h4 style={{
            fontFamily: "var(--font-sans)", fontWeight: 600,
            fontSize: 16, margin: 0, letterSpacing: "0.01em", color: "#241a12",
          }}>
            {item.name}
          </h4>
          {item.description && (
            <p style={{
              fontSize: 13, fontWeight: 300, lineHeight: 1.5,
              opacity: 0.62, margin: "7px 0 0", flex: 1, color: "#241a12",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as "vertical",
            }}>
              {item.description}
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
            <span style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 24, color: "#241a12" }}>
              ${item.price.toLocaleString("es-CO")}
            </span>
            <button
              aria-label={`Ver detalles de ${item.name}`}
              onClick={e => { e.stopPropagation(); onSelect?.(item); }}
              style={{
                width: 38, height: 38, borderRadius: "50%",
                border: "1px solid rgba(36,26,18,0.2)",
                background: "transparent", color: "#241a12",
                fontSize: 20, lineHeight: 1, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .2s",
              }}
              onMouseEnter={e => { const t = e.currentTarget; t.style.background = "#241a12"; t.style.color = "#F2ECE1"; t.style.borderColor = "#241a12"; }}
              onMouseLeave={e => { const t = e.currentTarget; t.style.background = "transparent"; t.style.color = "#241a12"; t.style.borderColor = "rgba(36,26,18,0.2)"; }}
            >
              +
            </button>
          </div>
        </div>
      </motion.article>
    </div>
  );
}
