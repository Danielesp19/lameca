import { useState, useEffect } from "react";
import { getHero, HeroSection } from "@/lib/menu-api";

export function useHero() {
  const [hero, setHero] = useState<HeroSection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHero()
      .then(heroes => setHero(heroes[0] ?? null))
      .catch(() => setHero(null))
      .finally(() => setLoading(false));
  }, []);

  return { hero, loading };
}
