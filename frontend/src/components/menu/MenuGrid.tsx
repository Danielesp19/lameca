"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MenuCategory } from "@/lib/menu-api";
import CategoryTabs from "./CategoryTabs";
import MenuCard from "./MenuCard";

export default function MenuGrid({ categories }: { categories: MenuCategory[] }) {
  const [activeId, setActiveId] = useState(categories[0]?.id ?? 0);

  const active = categories.find((c) => c.id === activeId) ?? categories[0];

  if (!active) return null;

  return (
    <section id="menu" aria-label="Carta del menú">
      <CategoryTabs
        categories={categories}
        activeId={activeId}
        onChange={setActiveId}
      />

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Category header */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id + "-header"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
            className="mb-10"
          >
            <h2
              className="text-3xl md:text-4xl font-bold mb-2"
              style={{ fontFamily: "var(--font-serif)", color: "#FAF7F2" }}
            >
              {active.name}
            </h2>
            {active.description && (
              <p className="text-sm" style={{ color: "#A89880" }}>
                {active.description}
              </p>
            )}
            <div
              className="mt-4 h-px w-16"
              style={{ background: "linear-gradient(to right, #C8A97E, transparent)" }}
              aria-hidden="true"
            />
          </motion.div>
        </AnimatePresence>

        {/* Cards grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id + "-grid"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            role="tabpanel"
            id={`panel-${active.slug}`}
            aria-label={active.name}
          >
            {active.items.map((item) => (
              <MenuCard key={item.id} item={item} isActive={false} />
            ))}

            {active.items.length === 0 && (
              <div
                className="col-span-full py-20 text-center"
                style={{ color: "#6F4E37" }}
              >
                <p className="text-lg" style={{ fontFamily: "var(--font-serif)" }}>
                  Pronto habrá novedades en esta sección.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
