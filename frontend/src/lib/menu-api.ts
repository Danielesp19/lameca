export interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  video_url: string | null;
  extra_image_urls: string[];
  is_featured: boolean;
  is_available?: boolean;
  category?: string;
  caffeine_level: number | null;   // 0–3, null = no mostrar
  has_sugar_option: boolean;       // el cliente puede elegir nivel de azúcar
}

// ── Nivel de azúcar (lo elige el cliente al pedir) ───────────────────────────
export const SUGAR_OPTIONS = [
  { value: "Sin azúcar", emoji: "🚫" },
  { value: "Poca",       emoji: "🤏" },
  { value: "Normal",     emoji: "🥄" },
  { value: "Extra",      emoji: "🍯" },
] as const;

export const DEFAULT_SUGAR = "Normal";

// ── Nivel de cafeína (lo configura el admin, se muestra con emojis) ───────────
export interface CaffeineInfo {
  emoji: string;
  label: string;
  beans: number;
}

export function caffeineInfo(level: number | null | undefined): CaffeineInfo | null {
  switch (level) {
    case 0:  return { emoji: "🌿",     label: "Sin cafeína",   beans: 0 };
    case 1:  return { emoji: "☕",      label: "Cafeína baja",  beans: 1 };
    case 2:  return { emoji: "☕☕",    label: "Cafeína media", beans: 2 };
    case 3:  return { emoji: "☕☕☕",  label: "Cafeína alta",  beans: 3 };
    default: return null;
  }
}

export interface MenuCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  items: MenuItem[];
}

export interface HeroSection {
  id: number;
  title: string;
  subtitle: string | null;
  youtube_url: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
}

// Server-side: hit Laravel directly (no rewrite overhead)
// Client-side: use Next.js rewrite proxy to avoid CORS
const BASE =
  typeof window === "undefined"
    ? (process.env.MENU_API_INTERNAL ?? "http://localhost:8001/api")
    : (process.env.NEXT_PUBLIC_MENU_API ?? "/api-menu");

async function fetchJson<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const isServer = typeof window === "undefined";
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...(isServer ? { next: { revalidate: 60 } } : {}),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timeout);
  }
}

// Transform backend storage URLs to the Next.js proxy route so the browser
// never hits localhost:8001 directly (avoids PHP single-thread blocking).
export function storageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.replace(/^https?:\/\/[^/]+\/storage\//, "/menu-storage/");
}

export const getMenu = () =>
  fetchJson<MenuCategory[]>("/menu").then(cats =>
    cats.map(cat => ({
      ...cat,
      items: cat.items.map(normalizeItem),
    }))
  );

export const getHero = () => fetchJson<HeroSection[]>("/menu/hero").then(h => h.map(normalizeHero));
export const getItem = (id: number) => fetchJson<MenuItem>(`/menu/items/${id}`).then(normalizeItem);

function normalizeItem(item: MenuItem): MenuItem {
  return {
    ...item,
    image_url:        storageUrl(item.image_url),
    video_url:        storageUrl(item.video_url),
    extra_image_urls: item.extra_image_urls.map(u => storageUrl(u)!),
  };
}

function normalizeHero(h: HeroSection): HeroSection {
  return { ...h, image_url: storageUrl(h.image_url) };
}

export function getYouTubeEmbedUrl(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (!match) return "";
  const id = match[1];
  return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&rel=0&showinfo=0&modestbranding=1&playsinline=1`;
}
