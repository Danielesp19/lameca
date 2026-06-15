export interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  gif_url: string | null;
  youtube_url: string | null;
  is_featured: boolean;
  is_available?: boolean;
  category?: string;
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
  gif_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
}

const BASE = process.env.NEXT_PUBLIC_MENU_API ?? "/api-menu";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export const getMenu  = () => fetchJson<MenuCategory[]>("/menu");
export const getHero  = () => fetchJson<HeroSection[]>("/menu/hero");

export function getYouTubeEmbedUrl(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (!match) return "";
  const id = match[1];
  return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&rel=0&showinfo=0&modestbranding=1&playsinline=1`;
}
