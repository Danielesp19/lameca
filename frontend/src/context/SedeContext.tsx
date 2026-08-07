"use client";

import {
  createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode,
} from "react";
import { getSedes } from "@/lib/orders-api";
import type { SedeInfo } from "@/lib/table-session";

/**
 * Sede que está viendo el cliente.
 *
 * Cada local imprime su propio QR (menulameca.com/?sede=campestre), así que lo
 * normal es que la sede llegue en la URL y el cliente nunca elija nada. Se
 * recuerda en localStorage para que volver a entrar por el navegador (sin QR)
 * caiga en la misma carta. Quien llega sin QR y sin haber elegido nunca, ve el
 * selector una vez.
 */
const STORAGE_KEY = "lameca_sede";
const PARAM = "sede";

interface SedeCtx {
  /** Todas las sedes activas. Vacío mientras carga o si el backend falla. */
  sedes: SedeInfo[];
  /** La sede elegida, o null si todavía no se sabe cuál es. */
  sede: SedeInfo | null;
  /** true mientras se resuelve: no hay que mostrar el selector todavía. */
  cargando: boolean;
  /**
   * Hay que preguntarle al cliente: ya cargaron las sedes, hay más de una, y
   * ni la URL ni lo guardado dicen cuál.
   */
  debePreguntar: boolean;
  elegirSede: (s: SedeInfo) => void;
  /** Vuelve a preguntar (para el botón de "cambiar sede"). */
  limpiarSede: () => void;
}

const Ctx = createContext<SedeCtx | null>(null);

export function SedeProvider({ children }: { children: ReactNode }) {
  const [sedes, setSedes] = useState<SedeInfo[]>([]);
  const [slug, setSlug] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // La URL manda sobre lo guardado: si alguien escanea el QR de Centro
    // estando "recordado" en Campestre, tiene que ver la carta de Centro.
    let inicial: string | null = null;
    try {
      const enUrl = new URLSearchParams(window.location.search).get(PARAM);
      inicial = enUrl || localStorage.getItem(STORAGE_KEY);
      if (enUrl) localStorage.setItem(STORAGE_KEY, enUrl);
    } catch { /* ignore */ }
    setSlug(inicial);

    getSedes()
      .then(lista => setSedes(lista))
      .catch(() => { /* sin sedes: la carta se muestra completa */ })
      .finally(() => setCargando(false));
  }, []);

  const elegirSede = useCallback((s: SedeInfo) => {
    if (!s.slug) return;
    setSlug(s.slug);
    try { localStorage.setItem(STORAGE_KEY, s.slug); } catch { /* ignore */ }
  }, []);

  const limpiarSede = useCallback(() => {
    setSlug(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  const sede = useMemo(
    () => (slug ? sedes.find(s => s.slug === slug) ?? null : null),
    [sedes, slug],
  );

  // Con una sola sede no hay nada que preguntar ni que filtrar.
  const debePreguntar = !cargando && sedes.length > 1 && !sede;

  const value: SedeCtx = { sedes, sede, cargando, debePreguntar, elegirSede, limpiarSede };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSede(): SedeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSede debe usarse dentro de <SedeProvider>");
  return ctx;
}

/**
 * ¿Este producto se ofrece en la sede activa?
 *
 * Sin sede elegida (o producto sin sedes asignadas, p.ej. backend viejo que
 * todavía no manda el campo) se muestra: es preferible mostrar de más a
 * esconder media carta por un dato que falta.
 */
export function seVendeEn(sedeIds: number[] | undefined, sedeId: number | null): boolean {
  if (sedeId === null) return true;
  if (!sedeIds || sedeIds.length === 0) return true;
  return sedeIds.includes(sedeId);
}
