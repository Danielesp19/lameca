import { useState, useEffect, useCallback } from "react";
import { getMenu, MenuCategory } from "@/lib/menu-api";

// `initial` viene del render en servidor (ISR). Si llega con datos, el hook arranca
// ya poblado y NO hace fetch en el cliente → el backend no recibe la petición por
// cada visita. Solo se hace fetch en el cliente al reintentar, o si el servidor no
// pudo traer datos (array vacío) como fallback de resiliencia.
export function useMenu(initial?: MenuCategory[]) {
  const hasInitial = initial != null && initial.length > 0;
  const [categories, setCategories] = useState<MenuCategory[]>(initial ?? []);
  const [loading, setLoading]       = useState(!hasInitial);
  const [error, setError]           = useState<string | null>(null);
  const [tick, setTick]             = useState(0);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setTick(n => n + 1);
  }, []);

  useEffect(() => {
    // Salta el primer fetch cuando el servidor ya entregó datos (tick === 0).
    if (hasInitial && tick === 0) return;
    let cancelled = false;
    setLoading(true);
    getMenu()
      .then(data => { if (!cancelled) setCategories(data); })
      .catch(e  => { if (!cancelled) setError((e as Error).message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  return { categories, loading, error, retry };
}
