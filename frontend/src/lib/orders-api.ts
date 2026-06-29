// API pública de pedidos (carta digital → mesa).
// Pasa por el proxy de Next.js (/api-menu → localhost:8001/api).

import type { SedeInfo, TableInfo } from "./table-session";

const BASE = process.env.NEXT_PUBLIC_MENU_API ?? "/api-menu";

export type { SedeInfo, TableInfo };

export interface OrderLine {
  id: number;        // menu_item_id
  quantity: number;
  notes?: string;
  sugar_level?: string;
}

export interface OrderResult {
  id: number;
  status: string;
  message: string;
}

export interface MintResult {
  session: string;
  expires_in: number;   // segundos de vida de la sesión
  table: TableInfo;
  sede: SedeInfo | null;
}

/** Error con bandera de sesión expirada (419) → el front pide re-escanear. */
export class SessionExpiredError extends Error {
  expired = true as const;
  constructor(message = "Tu sesión de mesa expiró. Vuelve a escanear el QR.") {
    super(message);
    this.name = "SessionExpiredError";
  }
}

/** Capa 1+5: el QR mintea una sesión corta a partir del token secreto de la mesa. */
export async function mintSession(token: string): Promise<MintResult | null> {
  try {
    const res = await fetch(`${BASE}/tables/${encodeURIComponent(token)}/session`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as MintResult;
  } catch {
    return null;
  }
}

/** Sedes públicas (para el botón de WhatsApp del menú público). */
export async function getSedes(): Promise<SedeInfo[]> {
  try {
    const res = await fetch(`${BASE}/sedes`, { headers: { Accept: "application/json" } });
    if (!res.ok) return [];
    return (await res.json()) as SedeInfo[];
  } catch {
    return [];
  }
}

/** Enviar un pedido o una llamada al mesero (requiere sesión de mesa válida). */
export async function createOrder(params: {
  session: string;
  type?: "order" | "call";
  items?: OrderLine[];
  note?: string;
  turnstileToken?: string;
}): Promise<OrderResult> {
  const res = await fetch(`${BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      session: params.session,
      type: params.type ?? "order",
      items: params.items?.map(i => ({
        id: i.id,
        quantity: i.quantity,
        notes: i.notes,
        sugar_level: i.sugar_level,
      })),
      note: params.note,
      turnstile_token: params.turnstileToken,
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 419 || json.expired) throw new SessionExpiredError(json.error);
    if (res.status === 429) throw new Error("Demasiados pedidos seguidos. Espera un momento.");
    throw new Error(json.error ?? json.message ?? `Error ${res.status}`);
  }
  return json as OrderResult;
}
