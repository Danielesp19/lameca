"use client";

import {
  createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode,
} from "react";
import { readSession, StoredSession, TableInfo, SedeInfo } from "@/lib/table-session";

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

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = "lameca_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [stored, setStored] = useState<StoredSession | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  // Cargar carrito persistido (migra líneas viejas sin `key`)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        setLines(parsed.map(l => l.key ? l : { ...l, key: lineKey(l.id, l.sugar_level) }));
      }
    } catch { /* ignore */ }
  }, []);

  // Persistir cambios del carrito
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(lines)); } catch { /* ignore */ }
  }, [lines]);

  // Cargar sesión de mesa y mantener un "reloj" para detectar la expiración.
  const refreshSession = useCallback(() => {
    setStored(readSession());
    setNow(Date.now());
  }, []);

  useEffect(() => {
    refreshSession();
    const id = setInterval(() => setNow(Date.now()), 20000); // re-evalúa expiración
    return () => clearInterval(id);
  }, [refreshSession]);

  const add = useCallback((
    item: { id: number; name: string; price: number; image_url: string | null },
    qty = 1,
    sugar_level?: string,
  ) => {
    const key = lineKey(item.id, sugar_level);
    setLines(prev => {
      const existing = prev.find(l => l.key === key);
      if (existing) {
        return prev.map(l => l.key === key ? { ...l, quantity: l.quantity + qty } : l);
      }
      return [...prev, { ...item, key, quantity: qty, sugar_level }];
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setLines(prev => qty <= 0
      ? prev.filter(l => l.key !== key)
      : prev.map(l => l.key === key ? { ...l, quantity: qty } : l));
  }, []);

  const remove = useCallback((key: string) => setLines(prev => prev.filter(l => l.key !== key)), []);
  const setNotes = useCallback((key: string, notes: string) =>
    setLines(prev => prev.map(l => l.key === key ? { ...l, notes } : l)), []);
  const clear = useCallback(() => setLines([]), []);

  const count = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines]);
  const total = useMemo(() => lines.reduce((s, l) => s + l.price * l.quantity, 0), [lines]);

  const hasSession     = !!stored && stored.exp > now;
  const sessionExpired = !!stored && stored.exp <= now;
  const session        = hasSession ? stored!.session : null;
  const table          = stored?.table ?? null;
  const sede           = stored?.sede ?? null;

  const value: CartCtx = {
    lines, count, total, table, sede, session, hasSession, sessionExpired,
    add, setQty, remove, setNotes, clear, refreshSession,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
