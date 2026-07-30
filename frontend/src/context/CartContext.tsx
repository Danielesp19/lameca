"use client";

import {
  createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode,
} from "react";
import { readSession, clearSession, StoredSession, TableInfo, SedeInfo } from "@/lib/table-session";

export interface CartLine {
  key: string;          // único por (producto + nivel de azúcar)
  id: number;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
  notes?: string;
  sugar_level?: string;
}

interface CartCtx {
  lines: CartLine[];
  count: number;
  total: number;
  table: TableInfo | null;
  sede: SedeInfo | null;
  session: string | null;     // token de sesión válido (o null)
  hasSession: boolean;        // sesión válida → modo QR (carrito habilitado)
  sessionExpired: boolean;    // hubo sesión pero caducó → invitar a re-escanear
  add: (
    item: { id: number; name: string; price: number; image_url: string | null },
    qty?: number,
    sugar_level?: string,
  ) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  setNotes: (key: string, notes: string) => void;
  clear: () => void;
  refreshSession: () => void; // re-lee localStorage (p.ej. al volver a escanear)
}

// Clave única de una línea: mismo producto con distinta azúcar = líneas separadas.
const lineKey = (id: number, sugar?: string) => `${id}__${sugar ?? ""}`;

// Vencimiento del carrito en modo público (sin mesa): sin esto, un carrito
// armado hace días seguía apareciendo en la próxima visita — nada lo
// limpiaba salvo un cambio de "contexto" (mesa distinta), que en modo
// público nunca cambia. En modo mesa esto casi nunca llega a dispararse: la
// sesión de la mesa (15 min) ya limpia el carrito mucho antes.
const CART_TTL_MS = 2 * 60 * 60 * 1000; // 2 horas

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = "lameca_cart";
// Contexto al que pertenece el carrito guardado: la mesa (sede+número) o
// "public" en modo sin sesión. Si al cargar no coincide con el contexto
// actual, el carrito es de una mesa/visita anterior y se descarta — evita
// que un pedido abandonado en una mesa reaparezca semanas después como si
// fuera un carrito público nuevo (o el de otra mesa).
const CONTEXT_KEY = "lameca_cart_context";

function contextFor(s: StoredSession | null): string {
  return s ? `table:${s.sede?.id ?? "?"}:${s.table.number}` : "public";
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  // Marca de tiempo del último cambio REAL del carrito (agregar, quitar,
  // cambiar cantidad/nota) — no de cuándo se cargó la página. Si en vez de
  // esto guardáramos "cuándo se escribió en localStorage" y lo reescribiéramos
  // en cada carga, visitar la página antes de que venza el carrito reiniciaría
  // el reloj sin que el cliente haya tocado nada, y nunca vencería de verdad.
  const [cartSavedAt, setCartSavedAt] = useState<number>(() => Date.now());
  const [stored, setStored] = useState<StoredSession | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  // Carga (o recarga) coordinada de sesión + carrito. Si la sesión YA estaba
  // vencida al momento de cargar (visita nueva, no la misma en la que expiró
  // en vivo), se limpia en silencio: sin eso, "sessionExpired" quedaría
  // pegado para siempre en cualquier visita futura, no solo justo tras vencer.
  const loadAll = useCallback(() => {
    const t = Date.now();
    const raw = readSession();
    const staleFromBefore = !!raw && raw.exp <= t;
    if (staleFromBefore) clearSession();

    const s = staleFromBefore ? null : raw;
    setStored(s);
    setNow(t);

    const ctx = contextFor(s);
    let storedCtx: string | null = null;
    try { storedCtx = localStorage.getItem(CONTEXT_KEY); } catch { /* ignore */ }

    if (storedCtx !== ctx) {
      // Cambió el contexto (otra mesa, sesión vencida, o primera visita):
      // el carrito guardado no es de aquí.
      setLines([]);
      setCartSavedAt(t);
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(CONTEXT_KEY, ctx);
      } catch { /* ignore */ }
      return;
    }

    try {
      const rawCart = localStorage.getItem(STORAGE_KEY);
      if (rawCart) {
        const parsed = JSON.parse(rawCart);
        // Retrocompat: carritos guardados antes de este cambio son un array
        // suelto, sin savedAt — se tratan como recién guardados (no vencidos)
        // en vez de borrarlos de golpe en el primer deploy de este fix.
        const cartLines: CartLine[] = Array.isArray(parsed) ? parsed : (parsed?.lines ?? []);
        const savedAt = Array.isArray(parsed) ? t : (Number(parsed?.savedAt) || t);

        if (t - savedAt > CART_TTL_MS) {
          setLines([]);
          setCartSavedAt(t);
          try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
        } else {
          setLines(cartLines.map(l => l.key ? l : { ...l, key: lineKey(l.id, l.sugar_level) }));
          setCartSavedAt(savedAt);
        }
      } else {
        setCartSavedAt(t);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadAll();
    const id = setInterval(() => setNow(Date.now()), 20000); // re-evalúa expiración
    return () => clearInterval(id);
  }, [loadAll]);

  // Persistir cambios del carrito (el contexto ya quedó fijado en loadAll).
  // savedAt viaja junto a las líneas para poder calcular el vencimiento en
  // la próxima visita sin depender de nada más que este mismo registro.
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ lines, savedAt: cartSavedAt })); } catch { /* ignore */ }
  }, [lines, cartSavedAt]);

  const hasSession     = !!stored && stored.exp > now;
  const sessionExpired = !!stored && stored.exp <= now;
  const cartExpired    = lines.length > 0 && now - cartSavedAt > CART_TTL_MS;

  // La sesión caducó EN VIVO (la persona sigue en la página, no es una
  // visita futura — ese caso ya lo filtra loadAll). Se limpia el carrito de
  // esa mesa para que no reaparezca más adelante como pedido público.
  useEffect(() => {
    if (!sessionExpired) return;
    setLines([]);
    setCartSavedAt(Date.now());
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(CONTEXT_KEY, "public");
    } catch { /* ignore */ }
  }, [sessionExpired]);

  // El carrito lleva más de 2 horas sin tocarse (visita pública, sin mesa) y
  // la persona sigue en la página: se limpia en vivo, no solo en la próxima
  // carga.
  useEffect(() => {
    if (!cartExpired) return;
    setLines([]);
    setCartSavedAt(Date.now());
  }, [cartExpired]);

  const add = useCallback((
    item: { id: number; name: string; price: number; image_url: string | null },
    qty = 1,
    sugar_level?: string,
  ) => {
    const key = lineKey(item.id, sugar_level);
    setCartSavedAt(Date.now());
    setLines(prev => {
      const existing = prev.find(l => l.key === key);
      if (existing) {
        return prev.map(l => l.key === key ? { ...l, quantity: l.quantity + qty } : l);
      }
      return [...prev, { ...item, key, quantity: qty, sugar_level }];
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setCartSavedAt(Date.now());
    setLines(prev => qty <= 0
      ? prev.filter(l => l.key !== key)
      : prev.map(l => l.key === key ? { ...l, quantity: qty } : l));
  }, []);

  const remove = useCallback((key: string) => {
    setCartSavedAt(Date.now());
    setLines(prev => prev.filter(l => l.key !== key));
  }, []);
  const setNotes = useCallback((key: string, notes: string) => {
    setCartSavedAt(Date.now());
    setLines(prev => prev.map(l => l.key === key ? { ...l, notes } : l));
  }, []);
  const clear = useCallback(() => { setCartSavedAt(Date.now()); setLines([]); }, []);

  const count = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines]);
  const total = useMemo(() => lines.reduce((s, l) => s + l.price * l.quantity, 0), [lines]);

  const session = hasSession ? stored!.session : null;
  const table   = stored?.table ?? null;
  const sede    = stored?.sede ?? null;

  const value: CartCtx = {
    lines, count, total, table, sede, session, hasSession, sessionExpired,
    add, setQty, remove, setNotes, clear, refreshSession: loadAll,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
