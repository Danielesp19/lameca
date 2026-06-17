"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHero } from "@/hooks/useHero";

const ACCENT = "#C8A97E";

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, delay, ease: [0.2, 0.7, 0.2, 1] as const },
});

export default function HeroSection() {
  const { hero } = useHero();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Media from admin: gif or image. Fallback to local video.
  const bgGifOrImg = hero?.gif_url ?? hero?.image_url ?? null;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const upd = () => {
      setIsMobile(mq.matches);
      if (!mq.matches) setMenuOpen(false);
    };
    upd();
    mq.addEventListener("change", upd);
    return () => mq.removeEventListener("change", upd);
  }, []);

  // Ensure video autoplays (mobile browsers block autoplay without user gesture)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.playbackRate = 0.75;
    const tryPlay = () => { v.muted = true; v.play().catch(() => {}); };
    if (v.readyState >= 2) tryPlay();
    else v.addEventListener("loadeddata", tryPlay, { once: true });
    // Fallback on first user gesture
    const kick = () => { v.play().catch(() => {}); };
    ["pointerdown", "touchstart"].forEach(e => window.addEventListener(e, kick, { once: true, passive: true }));
    return () => ["pointerdown", "touchstart"].forEach(e => window.removeEventListener(e, kick));
  }, [bgGifOrImg]); // re-run if source changes

  return (
    <div style={{ position: "relative", width: "100%", background: "#120c08", fontFamily: "var(--font-sans)", color: "#F4EEE3" }}>
      <section style={{ position: "sticky", top: 0, width: "100%", height: "100dvh", minHeight: 540, overflow: "hidden", background: "#120c08", zIndex: 1 }}>

        {/* ── Background media ── */}
        {bgGifOrImg ? (
          // Admin uploaded gif/image takes priority
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bgGifOrImg} alt="" aria-hidden="true" className="hero-bg-media" />
        ) : (
          // Default: local hero video with slowZoom animation
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            tabIndex={-1}
            className="hero-bg-media"
          >
            <source src="/videos/hero-coffee.mp4" type="video/mp4" />
          </video>
        )}

        {/* ── Gradient overlays ── */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(14,9,6,0.62) 0%, rgba(18,12,8,0.46) 32%, rgba(18,12,8,0.5) 64%, rgba(11,7,4,0.72) 100%)" }} />
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 90% at 50% 40%, rgba(0,0,0,0) 40%, rgba(8,5,3,0.55) 100%)" }} />

        {/* ── Header ── */}
        <header style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 30, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, padding: "clamp(18px,3.2vw,34px) clamp(20px,5vw,68px)", animation: "videoIn 1.1s ease both" }}>
          <a href="#" style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none", color: "#F4EEE3" }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: "50%", background: "rgba(244,238,227,0.94)", boxShadow: "0 4px 18px rgba(0,0,0,0.35)", flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="La Meca" style={{ width: 42, height: 42, objectFit: "contain", display: "block" }} />
            </span>
            <span style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
              <span style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 22, letterSpacing: "0.34em", paddingLeft: "0.34em", whiteSpace: "nowrap" }}>LA MECA</span>
              <span style={{ fontSize: 9, letterSpacing: "0.42em", paddingLeft: "0.42em", opacity: 0.7, marginTop: 5, textTransform: "uppercase", whiteSpace: "nowrap" }}>Café · Coffee House</span>
            </span>
          </a>

          {!isMobile ? (
            <a
              href="#menu"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 24px", border: "1px solid rgba(244,238,227,0.55)", borderRadius: 999, color: "#F4EEE3", textDecoration: "none", fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", backdropFilter: "blur(2px)", transition: "all .25s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#F4EEE3"; (e.currentTarget as HTMLAnchorElement).style.color = "#1a120c"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = "#F4EEE3"; }}
            >
              Ver menú
            </a>
          ) : (
            <button
              aria-label="Abrir menú de navegación"
              onClick={() => setMenuOpen(v => !v)}
              style={{ display: "flex", flexDirection: "column", gap: 5, background: "transparent", border: "none", cursor: "pointer", padding: 8 }}
            >
              <span style={{ width: 26, height: 1.5, background: "#F4EEE3", display: "block" }} />
              <span style={{ width: 26, height: 1.5, background: "#F4EEE3", display: "block" }} />
              <span style={{ width: 18, height: 1.5, background: "#F4EEE3", display: "block" }} />
            </button>
          )}
        </header>

        {/* ── Mobile overlay ── */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "clamp(22px,4vw,34px)", background: "rgba(11,7,4,0.96)", backdropFilter: "blur(16px)" }}
            >
              <button
                aria-label="Cerrar menú"
                onClick={() => setMenuOpen(false)}
                style={{ position: "absolute", top: 22, right: 20, width: 46, height: 46, borderRadius: "50%", border: "1px solid rgba(244,238,227,0.3)", background: "transparent", color: "#F4EEE3", fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ×
              </button>
              <motion.a
                href="#menu"
                onClick={() => setMenuOpen(false)}
                {...rise(0.05)}
                style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "clamp(38px,11vw,52px)", color: "#F4EEE3", textDecoration: "none" }}
              >
                Ver menú
              </motion.a>
              <span style={{ width: 44, height: 1, background: ACCENT, display: "block" }} />
              <motion.div {...rise(0.12)} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", opacity: 0.55, marginBottom: 8 }}>Horario · Hours</div>
                <div style={{ fontSize: 16, letterSpacing: "0.03em" }}>Lun–Dom · 7:00 — 21:00</div>
              </motion.div>
              <motion.div {...rise(0.19)} style={{ display: "flex", gap: 14 }}>
                {(["IG", "FB", "TT"] as const).map(label => (
                  <a key={label} href="#" aria-label={label} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 42, height: 42, border: "1px solid rgba(244,238,227,0.4)", borderRadius: "50%", color: "#F4EEE3", textDecoration: "none", fontSize: 12 }}>
                    {label}
                  </a>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Hero content — centrado elegante ── */}
        <div style={{ position: "absolute", inset: 0, zIndex: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 24px" }}>

          {/* Eyebrow */}
          <motion.div {...rise(0.15)} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "clamp(18px,3vw,30px)" }}>
            <span style={{ width: "clamp(28px,5vw,54px)", height: 1, background: ACCENT, display: "block" }} />
            <span style={{ fontSize: "clamp(10px,1.4vw,13px)", letterSpacing: "0.5em", paddingLeft: "0.5em", textTransform: "uppercase", opacity: 0.85 }}>BIENVENIDO</span>
            <span style={{ width: "clamp(28px,5vw,54px)", height: 1, background: ACCENT, display: "block" }} />
          </motion.div>

          {/* Heading */}
          <motion.h1
            {...rise(0.28)}
            style={{ fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: "clamp(54px,12vw,140px)", lineHeight: 0.94, margin: 0, letterSpacing: "-0.01em", textShadow: "0 6px 40px rgba(0,0,0,0.45)", color: "#F4EEE3" }}
          >
            {hero?.title
              ? hero.title
              : <>Nuestro <span style={{ fontStyle: "italic", color: "#F0E8D8" }}>Café</span></>
            }
          </motion.h1>

          {/* Subtitle */}
          {hero?.subtitle && (
            <motion.p
              {...rise(0.42)}
              style={{ maxWidth: 540, margin: "clamp(20px,3vw,32px) 0 0", fontSize: "clamp(15px,1.6vw,19px)", fontWeight: 300, lineHeight: 1.6, opacity: 0.85 }}
            >
              {hero.subtitle}
            </motion.p>
          )}

          {/* CTA */}
          <motion.a
            href={hero?.cta_url ?? "#menu"}
            {...rise(0.56)}
            whileHover={{ y: -3, boxShadow: "0 18px 44px rgba(0,0,0,0.5)" }}
            style={{ marginTop: "clamp(28px,3.6vw,44px)", display: "inline-flex", alignItems: "center", gap: 12, padding: "16px 38px", background: "#F4EEE3", color: "#1a120c", textDecoration: "none", fontSize: 14, letterSpacing: "0.16em", textTransform: "uppercase", borderRadius: 999, boxShadow: "0 12px 36px rgba(0,0,0,0.4)", fontFamily: "var(--font-sans)", fontWeight: 500, transition: "transform .25s" }}
          >
            {hero?.cta_label ?? "Ver menú"} <span style={{ fontSize: 16 }}>→</span>
          </motion.a>
        </div>

        {/* ── Scroll indicator ── */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.6 }}
          style={{ position: "absolute", bottom: "clamp(22px,3vw,40px)", left: "50%", transform: "translateX(-50%)", zIndex: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
          aria-hidden="true"
        >
          <span style={{ fontSize: 10, letterSpacing: "0.32em", textTransform: "uppercase", opacity: 0.7 }}>Scroll</span>
          <span style={{ position: "relative", width: 22, height: 34, border: "1px solid rgba(244,238,227,0.5)", borderRadius: 12, display: "block" }}>
            <span className="scroll-dot" style={{ position: "absolute", top: 6, left: "50%", marginLeft: -1.5, width: 3, height: 6, borderRadius: 2, background: ACCENT }} />
          </span>
        </motion.div>

        {/* ── Desktop: schedule + socials ── */}
        {!isMobile && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.8 }}
              style={{ position: "absolute", left: "clamp(20px,5vw,68px)", bottom: "clamp(22px,3.4vw,40px)", zIndex: 25, display: "flex", flexDirection: "column", gap: 6 }}
              aria-hidden="true"
            >
              <span style={{ fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", opacity: 0.55 }}>Horario · Hours</span>
              <span style={{ fontSize: 13, letterSpacing: "0.04em", opacity: 0.9 }}>Lun–Dom · 7:00 — 21:00</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 0.8 }}
              style={{ position: "absolute", right: "clamp(20px,5vw,68px)", bottom: "clamp(22px,3.4vw,40px)", zIndex: 25, display: "flex", alignItems: "center", gap: 12 }}
            >
              <span style={{ fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", opacity: 0.55, marginRight: 4 }}>Síguenos</span>
              {(["IG", "FB", "TT"] as const).map(label => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, border: "1px solid rgba(244,238,227,0.4)", borderRadius: "50%", color: "#F4EEE3", textDecoration: "none", fontSize: 11, letterSpacing: "0.04em", transition: "all .25s" }}
                  onMouseEnter={e => { const t = e.currentTarget; t.style.background = "#F4EEE3"; t.style.color = "#1a120c"; t.style.borderColor = "#F4EEE3"; }}
                  onMouseLeave={e => { const t = e.currentTarget; t.style.background = "transparent"; t.style.color = "#F4EEE3"; t.style.borderColor = "rgba(244,238,227,0.4)"; }}
                >
                  {label}
                </a>
              ))}
            </motion.div>
          </>
        )}

      </section>
    </div>
  );
}
