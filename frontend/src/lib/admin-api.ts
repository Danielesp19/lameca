// JSON requests go through the Next.js rewrite proxy (/api-menu → localhost:8001/api).
// File uploads (FormData) go DIRECTLY to PHP to avoid Next.js buffering the body,
// which causes 413 errors on large files even when PHP limits are high.

const BASE        = "/api-menu/admin";
// Las subidas de archivos van DIRECTO a Laravel (saltan el proxy de Next para evitar 413).
// En producción el navegador debe alcanzar el backend público → NEXT_PUBLIC_BACKEND_URL.
// (requiere que ese origen esté en CORS_ALLOWED_ORIGINS del backend).
const BASE_DIRECT = `${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8001"}/api/admin`;

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
  caffeine_level: number | null;
  has_sugar_option: boolean;
  price: number;
  menu_category_id: number;
  category_name: string | null;
  image_url: string | null;
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
    video_url:    storageUrl(item.video_url),
    extra_images: item.extra_images.map(img => ({ ...img, url: storageUrl(img.url)! })),
  };
}

async function request<T>(path: string, init: RequestInit = {}, direct = false): Promise<T> {
  const base = direct ? BASE_DIRECT : BASE;
  const res = await fetch(`${base}${path}`, init);
  if (res.status === 204) return null as T;
  const json = await res.json();
  if (!res.ok) {
    // Laravel validation errors come in json.errors — show the first one
    const firstError = json.errors ? Object.values(json.errors as Record<string, string[]>)[0]?.[0] : null;
    throw new Error(firstError ?? json.message ?? json.error ?? `HTTP ${res.status}`);
  }
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

// Reordena las categorías: envía los ids en el orden deseado.
export const adminReorderCategories = (ids: number[]) =>
  request<AdminCategory[]>("/categories/reorder", {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });

// ── Items ─────────────────────────────────────────────────────────────────────
export const adminGetItems = () =>
  request<AdminItem[]>("/items", { headers: authHeaders() })
    .then(items => items.map(normalizeItem));

// File uploads go directly to PHP (bypass Next.js proxy to avoid 413)
export const adminCreateItem = (data: FormData) =>
  request<AdminItem>("/items", {
    method: "POST",
    headers: authHeaders(),
    body: data,
  }, true).then(normalizeItem);

export const adminUpdateItem = (id: number, data: FormData) => {
  data.append("_method", "PUT");
  return request<AdminItem>(`/items/${id}`, {
    method: "POST",
    headers: authHeaders(),
    body: data,
  }, true).then(normalizeItem);
};

export const adminDeleteItem = (id: number) =>
  request<null>(`/items/${id}`, { method: "DELETE", headers: authHeaders() });

// ── Pedidos ─────────────────────────────────────────────────────────────────
export interface AdminOrderItem {
  name: string;
  price: number;
  quantity: number;
  notes: string | null;
  sugar_level: string | null;
}

export interface AdminOrder {
  id: number;
  table_label: string;
  table_id: number | null;
  sede_id: number | null;
  type: "order" | "call";
  status: "pending" | "seen" | "served" | "billed" | "dismissed" | "expired";
  total: number;
  note: string | null;
  created_at: string;
  abuse_flag: boolean;
  abuse_count: number;
  items: AdminOrderItem[];
}

export interface OrdersPage {
  data: AdminOrder[];
  meta: { current_page: number; last_page: number; total: number; per_page: number };
}

// `sedeId` opcional: null/undefined = todas las sedes.
function sedeParam(sedeId?: number | null): string {
  return sedeId ? `&sede_id=${sedeId}` : "";
}

export const adminGetOrders = (status = "active", page = 1, sedeId?: number | null) =>
  request<OrdersPage>(`/orders?status=${status}&page=${page}${sedeParam(sedeId)}`, { headers: authHeaders() });

export const adminPendingCount = (sedeId?: number | null) =>
  request<{ pending: number; active: number }>(
    `/orders/pending-count${sedeId ? `?sede_id=${sedeId}` : ""}`,
    { headers: authHeaders() },
  );

export const adminSetOrderStatus = (id: number, status: "pending" | "seen" | "served" | "billed" | "dismissed") =>
  request<AdminOrder>(`/orders/${id}/status`, {
    method: "PATCH",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

// ── Sedes ───────────────────────────────────────────────────────────────────
export interface AdminSede {
  id: number;
  name: string;
  slug: string;
  whatsapp_phone: string | null;
  address: string | null;
  is_active: boolean;
  sort_order: number;
}

export const adminGetSedes = () =>
  request<AdminSede[]>("/sedes", { headers: authHeaders() });

export const adminCreateSede = (data: Partial<AdminSede>) =>
  request<AdminSede>("/sedes", {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const adminUpdateSede = (id: number, data: Partial<AdminSede>) =>
  request<AdminSede>(`/sedes/${id}`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const adminDeleteSede = (id: number) =>
  request<null>(`/sedes/${id}`, { method: "DELETE", headers: authHeaders() });

// ── Mesas ───────────────────────────────────────────────────────────────────
export interface AdminTable {
  id: number;
  sede_id: number;
  sede_name: string | null;
  number: string;
  name: string | null;
  label: string;
  qr_token: string;
  token_rotated_at: string | null;
  is_active: boolean;
}

export const adminGetTables = (sedeId?: number | null) =>
  request<AdminTable[]>(`/tables${sedeId ? `?sede_id=${sedeId}` : ""}`, { headers: authHeaders() });

export const adminCreateTable = (data: { sede_id: number; number: string; name?: string | null; is_active?: boolean }) =>
  request<AdminTable>("/tables", {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const adminUpdateTable = (id: number, data: Partial<AdminTable>) =>
  request<AdminTable>(`/tables/${id}`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const adminDeleteTable = (id: number) =>
  request<null>(`/tables/${id}`, { method: "DELETE", headers: authHeaders() });

export const adminRotateTableToken = (id: number) =>
  request<AdminTable>(`/tables/${id}/rotate-token`, { method: "POST", headers: authHeaders() });
