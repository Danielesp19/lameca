"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { MenuItem } from "@/lib/menu-api";

function BackArrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
};

const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

export default function ItemDetail({ item }: { item: MenuItem }) {
  // Build ordered gallery: main image first, then extra images
  const gallery = [
    ...(item.image_url ? [item.image_url] : []),
    ...(item.extra_image_urls ?? []),
  ];

  const hasGif   = Boolean(item.gif_url);
  const hasVideo = Boolean(item.video_url);

  const [activeIdx, setActiveIdx] = useState(0);

  const heroSrc = gallery[activeIdx] ?? null;

  return (
    <main className="min-h-dvh" style={{ background: "#0A0705" }}>

      {/* Floating top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 flex items-center justify-between pointer-events-none">
        <Link
          href="/menu#menu"
          className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200"
          style={{
            background: "rgba(10,7,5,0.75)",
            color: "#C8A97E",
            border: "1px solid rgba(200,169,126,0.2)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <BackArrow />
          Volver
        </Link>

        {item.is_featured && (
          <span
            className="pointer-events-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: "rgba(200,169,126,0.12)",
              color: "#C8A97E",
              border: "1px solid rgba(200,169,126,0.3)",
              backdropFilter: "blur(12px)",
            }}
          >
            <StarIcon /> Destacado
          </span>
        )}
      </div>

      {/* ── Hero image (active) ── */}
      <div className="relative w-full overflow-hidden" style={{ height: "65vh", minHeight: 300 }}>
        {heroSrc ? (
          <Image
            key={heroSrc}
            src={heroSrc}
            alt={item.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
            style={{ transition: "opacity 300ms ease" }}
          />
        ) : hasGif ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.gif_url!}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #2C1508, #3B1F0A)" }}
          >
            <span className="text-9xl" style={{ opacity: 0.15 }}>☕</span>
          </div>
        )}

        {/* Gradient */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, #0A0705 0%, rgba(10,7,5,0.3) 50%, transparent 100%)" }}
          aria-hidden="true"
        />
      </div>

      {/* ── Thumbnails ── */}
      {gallery.length > 1 && (
        <div
          className="flex gap-3 px-6 -mt-6 relative z-10 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {gallery.map((url, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              aria-label={`Ver foto ${i + 1}`}
              style={{
                flexShrink: 0,
                width: 64,
                height: 48,
                borderRadius: 8,
                overflow: "hidden",
                position: "relative",
                border: i === activeIdx
                  ? "2px solid #C8A97E"
                  : "2px solid transparent",
                opacity: i === activeIdx ? 1 : 0.55,
                transition: "opacity 200ms, border-color 200ms",
                cursor: "pointer",
                padding: 0,
                background: "none",
              }}
            >
              <Image src={url} alt={`Foto ${i + 1}`} fill style={{ objectFit: "cover" }} sizes="64px" />
            </button>
          ))}

          {/* GIF/video badge — indicates hover animation exists */}
          {(hasGif || hasVideo) && (
            <div
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "0 10px",
                borderRadius: 8,
                background: "rgba(200,169,126,0.1)",
                border: "1px solid rgba(200,169,126,0.2)",
                fontSize: 11,
                color: "#C8A97E",
                whiteSpace: "nowrap",
              }}
            >
              ✨ {hasVideo ? "Video en carta" : "GIF en carta"}
            </div>
          )}
        </div>
      )}

      {/* ── Content ── */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="max-w-2xl mx-auto px-6 pt-6 pb-20 relative"
        style={{ marginTop: gallery.length > 1 ? 16 : -80 }}
      >
        {/* Name + price row */}
        <motion.div variants={fadeUp} className="flex items-end justify-between gap-4 mb-5">
          <h1
            className="text-4xl md:text-5xl font-bold leading-tight"
            style={{ fontFamily: "var(--font-serif)", color: "#FAF7F2" }}
          >
            {item.name}
          </h1>
          <span
            className="text-2xl font-bold flex-shrink-0 tabular-nums"
            style={{ fontFamily: "var(--font-serif)", color: "#C8A97E" }}
          >
            ${item.price.toLocaleString("es-CO")}
          </span>
        </motion.div>

        {/* Divider */}
        <motion.div
          variants={fadeUp}
          className="h-px mb-6"
          style={{ background: "linear-gradient(to right, rgba(200,169,126,0.4), transparent)" }}
          aria-hidden="true"
        />

        {/* Description */}
        {item.description ? (
          <motion.p
            variants={fadeUp}
            className="text-base leading-relaxed mb-10"
            style={{ color: "#C8A97E99", lineHeight: 1.8 }}
          >
            {item.description}
          </motion.p>
        ) : (
          <motion.p
            variants={fadeUp}
            className="text-sm mb-10 italic"
            style={{ color: "#6F4E37" }}
          >
            Sin descripción disponible.
          </motion.p>
        )}

        {/* Back CTA */}
        <motion.div variants={fadeUp}>
          <Link
            href="/menu#menu"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium tracking-wider uppercase transition-colors duration-200"
            style={{
              background: "rgba(111,78,55,0.2)",
              color: "#C8A97E",
              border: "1px solid rgba(200,169,126,0.25)",
            }}
          >
            <BackArrow />
            Volver al menú
          </Link>
        </motion.div>
      </motion.section>
    </main>
  );
}
