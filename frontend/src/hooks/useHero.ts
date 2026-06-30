import { useState, useEffect } from "react";
import { getHero, HeroSection } from "@/lib/menu-api";

// `initial` viene del render en servidor (ISR): `undefined` = el servidor no lo
// proveyó (hacer fetch como fallback); `null` = no hay hero configurado (válido,
// no hacer fetch); objeto = hero ya cargado. Así no se pega al backend por visita.
export function useHero(initial?: HeroSection | null) {
  const hasInitial = initial !== undefined;
  const [hero, setHero] = useState<HeroSection | null>(initial ?? null);
  const [loading, setLoading] = useState(!hasInitial);

  useEffect(() => {
    if (hasInitial) return;
    getHero()
      .then(heroes => setHero(heroes[0] ?? null))
      .catch(() => setHero(null))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { hero, loading };
}
