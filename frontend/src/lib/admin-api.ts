// All admin calls go through /api-menu (rewrite → http://localhost:8001/api)
// with an Authorization header stored in sessionStorage after login.

const BASE = "/api-menu/admin";

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  items_count?: number;
}

export interface AdminItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  menu_category_id: number;
  category_name: string | null;
  image_url: string | null;
  gif_url: string | null;
  video_url: string | null;
  extra_images: { id: number; url: string }[];
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
}

function token(): string {
  return typeof window !== "undefined" ? (sessionStorage.getItem("admin_token") ?? "") : "";
}

function authHeaders(): HeadersInit {
  return { Authorization: `Bearer ${token()}`, Accept: "application/json" };
}

function storageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.replace(/^https?:\/\/[^/]+\/storage\//, "/menu-storage/");
}

function normalizeItem(item: AdminItem): AdminItem {
  return {
    ...item,
    image_url:    storageUrl(item.image_url),
    gif_url:      storageUrl(item.gif_url),
    video_url:    storageUrl(item.video_url),
    extra_images: item.extra_images.map(img => ({ ...img, url: storageUrl(img.url)! })),
  };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (res.status === 204) return null as T;
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? json.error ?? `HTTP ${res.status}`);
  return json as T;
}

// ── Categories ───────────────────────────────────────────────────────────────
export const adminGetCategories = () =>
  request<AdminCategory[]>("/categories", { headers: authHeaders() });

export const adminCreateCategory = (data: Partial<AdminCategory>) =>
  request<AdminCategory>("/categories", {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const adminUpdateCategory = (id: number, data: Partial<AdminCategory>) =>
  request<AdminCategory>(`/categories/${id}`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const adminDeleteCategory = (id: number) =>
  request<null>(`/categories/${id}`, { method: "DELETE", headers: authHeaders() });

// ── Items ─────────────────────────────────────────────────────────────────────
export const adminGetItems = () =>
  request<AdminItem[]>("/items", { headers: authHeaders() })
    .then(items => items.map(normalizeItem));

export const adminCreateItem = (data: FormData) =>
  request<AdminItem>("/items", {
    method: "POST",
    headers: authHeaders(),
    body: data,
  }).then(normalizeItem);

export const adminUpdateItem = (id: number, data: FormData) => {
  data.append("_method", "PUT");
  return request<AdminItem>(`/items/${id}`, {
    method: "POST",
    headers: authHeaders(),
    body: data,
  }).then(normalizeItem);
};

export const adminDeleteItem = (id: number) =>
  request<null>(`/items/${id}`, { method: "DELETE", headers: authHeaders() });
