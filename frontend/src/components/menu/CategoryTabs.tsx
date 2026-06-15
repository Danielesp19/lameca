"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { MenuCategory } from "@/lib/menu-api";

interface Props {
  categories: MenuCategory[];
  activeId: number;
  onChange: (id: number) => void;
}

export default function CategoryTabs({ categories, activeId, onChange }: Props) {
  const listRef  = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const el = activeRef.current;
    const list = listRef.current;
    if (!el || !list) return;
    const elRect   = el.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    setIndicatorStyle({
      left:  el.offsetLeft,
      width: elRect.width,
    });
    // Scroll active tab into view on mobile
    const scrollLeft = el.offsetLeft - listRect.width / 2 + elRect.width / 2;
    list.scrollTo({ left: scrollLeft, behavior: "smooth" });
  }, [activeId]);

  return (
    <div
      className="sticky top-0 z-40 py-4"
      style={{
        background: "linear-gradient(to bottom, rgba(10,7,5,0.95) 80%, transparent 100%)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid rgba(200,169,126,0.08)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div
          ref={listRef}
          className="relative flex gap-1 overflow-x-auto pb-1 scrollbar-hide"
          style={{ scrollbarWidth: "none" }}
          role="tablist"
          aria-label="Categorías del menú"
        >
          {/* Sliding background indicator */}
          <motion.div
            className="absolute bottom-0 h-full rounded-full pointer-events-none"
            animate={indicatorStyle}
            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            style={{ background: "rgba(111,78,55,0.25)" }}
            aria-hidden="true"
          />

          {categories.map((cat) => {
            const isActive = cat.id === activeId;
            return (
              <button
                key={cat.id}
                ref={isActive ? activeRef : null}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${cat.slug}`}
                onClick={() => onChange(cat.id)}
                className="relative flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium tracking-wide transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  color: isActive ? "#C8A97E" : "#A89880",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {cat.name}
                {/* Bottom accent line */}
                {isActive && (
                  <motion.div
                    layoutId="tab-line"
                    className="absolute bottom-0 left-3 right-3 h-px"
                    style={{ background: "linear-gradient(to right, transparent, #C8A97E, transparent)" }}
                    transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
