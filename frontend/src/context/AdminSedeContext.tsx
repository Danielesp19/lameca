"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { adminGetSedes, AdminSede } from "@/lib/admin-api";

interface AdminSedeCtx {
  sedes: AdminSede[];
  current: number | null;          // null = aún sin cargar; siempre hay una sede seleccionada
  setCurrent: (id: number) => void;
  reload: () => void;
  loading: boolean;
}

const Ctx = createContext<AdminSedeCtx | null>(null);
const KEY = "admin_sede";

export function AdminSedeProvider({ children }: { children: ReactNode }) {
  const [sedes, setSedes] = useState<AdminSede[]>([]);
  const [current, setCurrentState] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try { setSedes(await adminGetSedes()); }
    catch { /* el guard del layout maneja el 401 */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem(KEY);
    if (saved && saved !== "all") setCurrentState(Number(saved));
    reload();
  }, [reload]);

  const setCurrent = useCallback((id: number) => {
    setCurrentState(id);
    sessionStorage.setItem(KEY, String(id));
  }, []);

  // No existe la vista "todas las sedes": al cargar, si no hay una sede
  // seleccionada (o la guardada ya no existe), se toma la primera.
  useEffect(() => {
    if (sedes.length === 0) return;
    if (current === null || !sedes.some(s => s.id === current)) {
      setCurrent(sedes[0].id);
    }
  }, [sedes, current, setCurrent]);

  return (
    <Ctx.Provider value={{ sedes, current, setCurrent, reload, loading }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAdminSede(): AdminSedeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminSede debe usarse dentro de <AdminSedeProvider>");
  return ctx;
}
