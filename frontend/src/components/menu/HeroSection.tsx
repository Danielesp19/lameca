"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useHero } from "@/hooks/useHero";
import type { HeroSection as HeroData } from "@/lib/menu-api";
import SedesModal from "@/components/menu/SedesModal";

const ACCENT = "#BC5A32";

// El video del hero se reproduce UNA sola vez por visita y queda congelado en el
// último frame como fondo estático. Salir y volver al hero no lo reinicia.
const MAX_LOOPS = 1;

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, delay, ease: [0.2, 0.7, 0.2, 1] as const },
});

export default function HeroSection({ initialHero }: { initialHero?: HeroData | null }) {
  const { hero } = useHero(initialHero);
  const [isMobile, setIsMobile] = useState(false);
  const [sedesOpen, setSedesOpen] = useState(false);
  const videoRef  = useRef<HTMLVideoElement>(null);
  const outerRef  = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Admin image takes priority; fallback to local video.
  const bgGifOrImg = hero?.image_url ?? null;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const upd = () => setIsMobile(mq.matches);
    upd();
    mq.addEventListener("change", upd);
    return () => mq.removeEventListener("change", upd);
  }, []);

  // Header con fade dinámico: al bajar hacia los productos se desvanece suave;
  // al volver a subir reaparece. Solo escribe opacity/transform (compositor).
  useEffect(() => {
    let raf: number | null = null;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const h = headerRef.current;
        if (!h) return;
        const f = Math.min(1, window.scrollY / (window.innerHeight * 0.45));
        h.style.opacity = (1 - f).toFixed(3);
        h.style.transform = `translateY(${(-16 * f).toFixed(1)}px)`;
        h.style.pointerEvents = f > 0.85 ? "none" : "";
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Controla el fondo del hero: el video se reproduce una sola vez y queda
  // estático, y la animación de zoom (video o imagen del admin) se pausa por
  // completo cuando el hero sale de pantalla — sin esto el navegador sigue
  // compositando un layer a pantalla completa mientras se scrollea el menú.
  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;
    const media = outer.querySelector<HTMLElement>(".hero-bg-media");
    const v = bgGifOrImg ? null : videoRef.current;

    let plays = 0;    // reproducciones completadas en esta visita a la página
    let done = false; // ya terminó: queda como fondo estático para siempre

    const onEnded = () => {
      plays += 1;
      if (v && plays < MAX_LOOPS) {
        v.currentTime = 0;
        v.play().catch(() => {});
      } else {
        done = true;
        // Fondo estático de verdad: también se detiene el zoom infinito (GPU).
        if (media) media.style.animationPlayState = "paused";
      }
    };
    if (v) {
      v.muted = true;
      v.playbackRate = 0.75;
      v.addEventListener("ended", onEnded);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Reanuda solo si quedó a mitad de la única pasada; si ya terminó,
          // se queda en el último frame sin volver a decodificar video.
          if (!done && media) media.style.animationPlayState = "running";
          if (!done && v) v.play().catch(() => {});
        } else {
          // Fuera de pantalla: detener video Y animación de zoom del fondo.
          if (media) media.style.animationPlayState = "paused";
          v?.pause();
        }
      },
      { threshold: 0.05 }, // reactiva cuando ~5% del hero vuelve a verse
    );

    observer.observe(outer);
    return () => {
      observer.disconnect();
      v?.removeEventListener("ended", onEnded);
    };
  }, [bgGifOrImg]);

  return (
    <div ref={outerRef} style={{ position: "relative", width: "100%", background: "#120c08", fontFamily: "var(--font-sans)", color: "#F4EEE3" }}>
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
            muted
            playsInline
            preload="metadata"
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

        {/* ── Header ──
            Sin texto "LA MECA" (redundante con el logo) → eslogan breve.
            Sin menú hamburguesa: "Ver menú" es la única acción y vive aquí.
            La animación de entrada se retira al terminar para que el fade por
            scroll (inline opacity) tome el control. */}
        <header
          ref={headerRef}
          onAnimationEnd={e => { e.currentTarget.style.animation = "none"; }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 30, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, padding: "clamp(18px,3.2vw,34px) clamp(20px,5vw,68px)", animation: "videoIn 1.1s ease both", willChange: "opacity, transform" }}
        >
          <a href="#" style={{ display: "flex", alignItems: "center", gap: 13, textDecoration: "none", color: "#F4EEE3", minWidth: 0 }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 50, height: 50, borderRadius: "50%", background: "rgba(244,238,227,0.94)", boxShadow: "0 4px 18px rgba(0,0,0,0.35)", flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="La Meca" style={{ width: 44, height: 44, objectFit: "contain", display: "block" }} />
            </span>
            <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "clamp(13px,3.4vw,16px)", lineHeight: 1.35, opacity: 0.92, maxWidth: 190 }}>
              Tostado en casa, servido con calma
            </span>
          </a>

          <button
            onClick={() => setSedesOpen(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px clamp(16px,3vw,24px)", border: "1px solid rgba(244,238,227,0.55)", borderRadius: 999, background: "transparent", cursor: "pointer", color: "#F4EEE3", fontFamily: "inherit", fontSize: "clamp(11px,2.6vw,13px)", letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap", flexShrink: 0, transition: "all .25s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#F4EEE3"; e.currentTarget.style.color = "#1a120c"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#F4EEE3"; }}
          >
            Nuestras sedes
          </button>
        </header>

        {/* Modal con la información de las sedes (fotos en /public/sedes/) */}
        <SedesModal open={sedesOpen} onClose={() => setSedesOpen(false)} />

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
