import { useState, useEffect } from "react";
import { getMenu, MenuCategory } from "@/lib/menu-api";

export function useMenu() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMenu()
      .then(setCategories)
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading, error };
}
