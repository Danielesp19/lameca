"use client";

import { motion } from "framer-motion";
import { HeroSection as IHero, getYouTubeEmbedUrl } from "@/lib/menu-api";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0 },
};

export default function HeroSection({ hero }: { hero: IHero | null }) {
  const embedUrl = hero?.youtube_url ? getYouTubeEmbedUrl(hero.youtube_url) : null;
  const bgImage  = hero?.gif_url ?? hero?.image_url ?? null;

  return (
    <section className="relative min-h-dvh flex items-center justify-center overflow-hidden">

      {/* ── Background media ── */}
      {embedUrl ? (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <iframe
            src={embedUrl}
            allow="autoplay; encrypted-media"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: "calc(100vh * 16 / 9)",
              height: "calc(100vw * 9 / 16)",
              minWidth: "100%",
              minHeight: "100%",
              border: "none",
            }}
            title="Hero background video"
            aria-hidden="true"
          />
        </div>
      ) : bgImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgImage})` }}
          aria-hidden="true"
        />
      ) : (
        /* Decorative fallback gradient */
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, #3B1F0A 0%, #160C07 50%, #0A0705 100%)",
          }}
          aria-hidden="true"
        />
      )}

      {/* ── Gradient overlays ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10,7,5,0.5) 0%, rgba(10,7,5,0.35) 40%, rgba(10,7,5,0.7) 80%, #0A0705 100%)",
        }}
        aria-hidden="true"
      />
      {/* Warm vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 50% 50%, transparent 40%, rgba(10,7,5,0.6) 100%)",
        }}
        aria-hidden="true"
      />

      {/* ── Grain ── */}
      <div className="grain-overlay" aria-hidden="true" />

      {/* ── Content ── */}
      <motion.div
        className="relative z-10 text-center px-6 max-w-3xl mx-auto"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.15 } } }}
      >
        {/* Eyebrow */}
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-sm tracking-[0.3em] uppercase mb-6"
          style={{ color: "#C8A97E", fontFamily: "var(--font-sans)" }}
        >
          Coffee Club
        </motion.p>

        {/* Title */}
        <motion.h1
          variants={fadeUp}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl md:text-7xl font-bold leading-tight mb-6"
          style={{ fontFamily: "var(--font-serif)", color: "#FAF7F2" }}
        >
          {hero?.title ?? "Nuestra Carta"}
        </motion.h1>

        {/* Subtitle */}
        {hero?.subtitle && (
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-xl leading-relaxed mb-10"
            style={{ color: "#A89880" }}
          >
            {hero.subtitle}
          </motion.p>
        )}

        {/* Divider */}
        <motion.div
          variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1 } }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="h-px w-24 mx-auto mb-10 origin-center"
          style={{ background: "linear-gradient(to right, transparent, #C8A97E, transparent)" }}
          aria-hidden="true"
        />

        {/* CTA */}
        <motion.a
          variants={fadeUp}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          href={hero?.cta_url ?? "#menu"}
          className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-sm font-medium tracking-widest uppercase transition-all duration-300"
          style={{
            background: "linear-gradient(135deg, #6F4E37, #3B1F0A)",
            color: "#C8A97E",
            border: "1px solid rgba(200,169,126,0.25)",
            boxShadow: "0 0 24px rgba(200,169,126,0.1)",
          }}
          whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(200,169,126,0.25)" }}
          whileTap={{ scale: 0.97 }}
        >
          {hero?.cta_label ?? "Explorar carta"}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.a>
      </motion.div>

      {/* ── Scroll indicator ── */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        aria-hidden="true"
      >
        <span className="text-xs tracking-widest uppercase" style={{ color: "#6F4E37" }}>Scroll</span>
        <motion.div
          className="w-px h-10"
          style={{ background: "linear-gradient(to bottom, #6F4E37, transparent)" }}
          animate={{ scaleY: [1, 0.5, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
}
