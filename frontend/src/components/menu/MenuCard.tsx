"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { MenuItem } from "@/lib/menu-api";

interface Props {
  item: MenuItem;
  index: number;
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
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

export default function MenuCard({ item, index }: Props) {
  const [hovered, setHovered] = useState(false);
  const hasGif    = Boolean(item.gif_url);
  const hasVideo  = Boolean(item.youtube_url);
  const hasImage  = Boolean(item.image_url);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: Math.min(index, 8) * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="glass-card rounded-2xl overflow-hidden group cursor-default focus-within:ring-2 focus-within:ring-coffee-300"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -4, transition: { duration: 0.25, ease: [0.25, 1, 0.5, 1] } }}
      aria-label={item.name}
    >
      {/* ── Media container ── */}
      <div className="relative aspect-[4/3] overflow-hidden bg-coffee-800">

        {/* Static image */}
        {hasImage && (
          <Image
            src={item.image_url!}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            style={{ opacity: hasGif && hovered ? 0 : 1, transition: "opacity 200ms ease, transform 500ms ease" }}
          />
        )}

        {/* GIF on hover */}
        {hasGif && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.gif_url!}
            alt={`${item.name} — animado`}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-200"
            style={{ opacity: hovered ? 1 : 0 }}
            aria-hidden={!hovered}
          />
        )}

        {/* No media fallback */}
        {!hasImage && !hasGif && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #2C1508, #3B1F0A)" }}
            aria-hidden="true"
          >
            <span className="text-4xl" style={{ opacity: 0.3 }}>☕</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(10,7,5,0.85) 0%, transparent 60%)" }}
          aria-hidden="true"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2" aria-hidden="true">
          {item.is_featured && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: "rgba(200,169,126,0.15)", color: "#C8A97E", border: "1px solid rgba(200,169,126,0.3)" }}
            >
              <StarIcon /> Destacado
            </span>
          )}
        </div>

        {/* YouTube play button */}
        {hasVideo && (
          <a
            href={item.youtube_url!}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
            style={{
              background: "rgba(10,7,5,0.7)",
              color: "#C8A97E",
              border: "1px solid rgba(200,169,126,0.2)",
            }}
            aria-label={`Ver video de ${item.name}`}
          >
            <PlayIcon />
          </a>
        )}

        {/* Price floating on image */}
        <div className="absolute bottom-3 right-3">
          <span
            className="text-lg font-bold"
            style={{ color: "#C8A97E", fontFamily: "var(--font-serif)", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
          >
            ${item.price.toLocaleString("es-CO")}
          </span>
        </div>
      </div>

      {/* ── Info ── */}
      <div className="p-5">
        <h3
          className="text-base font-semibold mb-1 leading-snug"
          style={{ color: "#FAF7F2", fontFamily: "var(--font-serif)" }}
        >
          {item.name}
        </h3>
        {item.description && (
          <p
            className="text-sm leading-relaxed line-clamp-2"
            style={{ color: "#A89880" }}
          >
            {item.description}
          </p>
        )}
      </div>
    </motion.article>
  );
}
