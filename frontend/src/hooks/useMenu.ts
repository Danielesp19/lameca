import { useState, useEffect, useCallback } from "react";
import { getMenu, MenuCategory } from "@/lib/menu-api";

export function useMenu() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [tick, setTick]             = useState(0);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setTick(n => n + 1);
  }, []);

  useEffect(() => {
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
