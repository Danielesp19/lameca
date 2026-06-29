"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  adminGetOrders, adminPendingCount, adminSetOrderStatus, AdminOrder,
  type OrdersPage as OrdersPageData,
} from "@/lib/admin-api";
import { useAdminSede } from "@/context/AdminSedeContext";

// ── Columnas del tablero ──────────────────────────────────────────────────────
// Cada columna agrupa uno o más estados. Al soltar una orden ahí, se le asigna
// el estado canónico de la columna (`target`).
type ColKey = "todo" | "prep" | "served" | "billed";
const COLUMNS: {
  key: ColKey;
  label: string;
  accent: string;
  statuses: AdminOrder["status"][];
  target: "pending" | "seen" | "served" | "billed";
}[] = [
  { key: "todo",   label: "Por atender",    accent: "#3E7C4F", statuses: ["pending"], target: "pending" },
  { key: "prep",   label: "En preparación", accent: "#D98E04", statuses: ["seen"],    target: "seen" },
  { key: "served", label: "Servido",        accent: "#C8A97E", statuses: ["served"],  target: "served" },
  { key: "billed", label: "Facturado",      accent: "#6F4E37", statuses: ["billed"],  target: "billed" },
];

const HISTORY_TABS = [
  { key: "dismissed", label: "Descartados" },
  { key: "expired",   label: "Expirados" },
  { key: "all",       label: "Todos" },
];

function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880; o.type = "sine";
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    o.start(); o.stop(ctx.currentTime + 0.5);
  } catch { /* sin audio */ }
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "hace un momento";
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  return `hace ${h} h`;
}

const money = (n: number) => `$${n.toLocaleString("es-CO")}`;

export default function OrdersPage() {
  const [view, setView]   = useState<"board" | "history">("board");
  const [orders, setOrders] = useState<AdminOrder[]>([]);            // tablero
  const [histTab, setHistTab]   = useState("dismissed");            // historial
  const [histPage, setHistPage] = useState(1);
  const [histData, setHistData] = useState<OrdersPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [soundOn, setSoundOn] = useState(true);
  const [dragId, setDragId]   = useState<number | null>(null);
  const [overCol, setOverCol] = useState<ColKey | null>(null);
  const lastPending = useRef<number | null>(null);
  const { current: sedeId, sedes } = useAdminSede();
  const sedeName = (id: number | null) => sedes.find(s => s.id === id)?.name ?? null;

  const loadBoard = useCallback(async () => {
    setLoading(true); setError("");
    try { setOrders((await adminGetOrders("board", 1, sedeId)).data); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [sedeId]);

  const loadHistory = useCallback(async () => {
    setLoading(true); setError("");
    try { setHistData(await adminGetOrders(histTab, histPage, sedeId)); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [histTab, histPage, sedeId]);

  useEffect(() => {
    if (view === "board") loadBoard(); else loadHistory();
  }, [view, loadBoard, loadHistory]);

  // Al cambiar de sede, reseteamos referencias para no falsear el sonido.
  useEffect(() => { lastPending.current = null; setHistPage(1); }, [sedeId]);

  // Polling ligero: solo el conteo. Si suben los pendientes → sonido + recarga del tablero.
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const { pending } = await adminPendingCount(sedeId);
        if (!alive) return;
        if (lastPending.current !== null && pending > lastPending.current) {
          if (soundOn) beep();
          if (view === "board") loadBoard();
        }
        lastPending.current = pending;
      } catch { /* ignore */ }
    };
    const id = setInterval(tick, 8000);
    tick();
    return () => { alive = false; clearInterval(id); };
  }, [soundOn, view, loadBoard, sedeId]);

  // Mueve una orden a un estado. Optimista: actualiza la UI antes de la red.
  const move = useCallback(async (o: AdminOrder, status: "pending" | "seen" | "served" | "billed" | "dismissed") => {
    setOrders(prev =>
      status === "dismissed"
        ? prev.filter(x => x.id !== o.id)
        : prev.map(x => (x.id === o.id ? { ...x, status } : x)),
    );
    try { await adminSetOrderStatus(o.id, status); }
    catch (e) { alert((e as Error).message); loadBoard(); }
  }, [loadBoard]);

  const onDrop = (col: typeof COLUMNS[number]) => (e: React.DragEvent) => {
    e.preventDefault();
    setOverCol(null);
    const id = dragId; setDragId(null);
    if (id === null) return;
    const o = orders.find(x => x.id === id);
    if (!o) return;
    // Sin cambios si ya está en esa columna.
    if (col.statuses.includes(o.status)) return;
    move(o, col.target);
  };

  return (
    <div>
      <style>{`
        .ccboard { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; align-items: start; }
        @media (max-width: 1100px) { .ccboard { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 620px)  { .ccboard { grid-template-columns: 1fr; } }
        .cccard { transition: box-shadow .15s, transform .1s; }
        .cccard:active { cursor: grabbing; }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1C0F05", fontFamily: "var(--font-serif)", margin: 0 }}>Pedidos</h2>
          <p style={{ fontSize: 13, color: "#9A7055", marginTop: 4 }}>
            {view === "board"
              ? "Arrastra las órdenes entre columnas para gestionarlas"
              : "Historial de órdenes cerradas"}
          </p>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6B5744", cursor: "pointer" }}>
          <input type="checkbox" checked={soundOn} onChange={e => setSoundOn(e.target.checked)} />
          🔔 Sonido
        </label>
      </div>

      {/* Vista: Tablero / Historial */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={() => setView("board")} style={tabBtn(view === "board")}>📋 Tablero</button>
        <button onClick={() => setView("history")} style={tabBtn(view === "history")}>🗂️ Historial</button>
      </div>

      {error && <p style={{ color: "#DC2626", fontSize: 14 }}>{error}</p>}

      {/* ── TABLERO ──────────────────────────────────────────────────────────── */}
      {view === "board" && (
        <>
          {loading && orders.length === 0 && <p style={{ color: "#9A7055", fontSize: 14 }}>Cargando…</p>}
          <div className="ccboard">
            {COLUMNS.map(col => {
              const cards = orders.filter(o => col.statuses.includes(o.status));
              const sum = cards.reduce((acc, o) => acc + o.total, 0);
              return (
                <div
                  key={col.key}
                  onDragOver={e => { e.preventDefault(); setOverCol(col.key); }}
                  onDragLeave={() => setOverCol(c => (c === col.key ? null : c))}
                  onDrop={onDrop(col)}
                  style={{
                    background: overCol === col.key ? "#FBF6F0" : "#F6F1EB",
                    border: overCol === col.key ? `2px dashed ${col.accent}` : "2px solid transparent",
                    borderRadius: 16, padding: 12, minHeight: 120,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "0 4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 999, background: col.accent }} />
                      <span style={{ fontWeight: 700, color: "#1C0F05", fontSize: 14 }}>{col.label}</span>
                      <span style={{ fontSize: 12, color: "#9A7055", background: "#FFF", borderRadius: 999, padding: "1px 8px", fontWeight: 600 }}>{cards.length}</span>
                    </div>
                    {sum > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: col.accent }}>{money(sum)}</span>}
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    {cards.map(o => (
                      <Card
                        key={o.id}
                        o={o}
                        colKey={col.key}
                        showSede={sedeId === null && sedes.length > 1}
                        sedeName={sedeName(o.sede_id)}
                        onDragStart={() => setDragId(o.id)}
                        onMove={move}
                      />
                    ))}
                    {cards.length === 0 && (
                      <p style={{ textAlign: "center", color: "#C4B5A6", fontSize: 12.5, padding: "18px 0" }}>
                        {col.key === "todo" ? "Sin pedidos nuevos" : "Vacío"}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── HISTORIAL ────────────────────────────────────────────────────────── */}
      {view === "history" && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
            {HISTORY_TABS.map(t => (
              <button key={t.key} onClick={() => { setHistTab(t.key); setHistPage(1); }} style={chip(histTab === t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          {loading && <p style={{ color: "#9A7055", fontSize: 14 }}>Cargando…</p>}
          {!loading && histData && (
            <>
              <div style={{ display: "grid", gap: 12 }}>
                {histData.data.map(o => (
                  <div key={o.id} style={{ background: "#FFFFFF", borderRadius: 12, padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: "#1C0F05", fontSize: 15 }}>{o.table_label}</div>
                        <div style={{ fontSize: 12, color: "#B0A090", marginTop: 2 }}>
                          {timeAgo(o.created_at)} · #{o.id}
                          {sedeId === null && sedes.length > 1 && sedeName(o.sede_id) && (
                            <span style={{ marginLeft: 6, color: "#9A7055" }}>· 🏪 {sedeName(o.sede_id)}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        {o.total > 0 && <div style={{ fontWeight: 700, color: "#6F4E37" }}>{money(o.total)}</div>}
                        <StatusPill status={o.status} />
                      </div>
                    </div>
                    {o.items.length > 0 && (
                      <ul style={{ margin: "10px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 3 }}>
                        {o.items.map((it, i) => (
                          <li key={i} style={{ fontSize: 13.5, color: "#3D2B1C" }}>
                            <strong>{it.quantity}×</strong> {it.name}
                            {it.sugar_level && <span style={{ marginLeft: 6, fontSize: 11, color: "#9A7055" }}>🍬 {it.sugar_level}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
                {histData.data.length === 0 && (
                  <p style={{ textAlign: "center", color: "#B0A090", fontSize: 14, padding: 40 }}>No hay pedidos aquí.</p>
                )}
              </div>

              {histData.meta.last_page > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 24, alignItems: "center" }}>
                  <button disabled={histPage <= 1} onClick={() => setHistPage(p => p - 1)} style={pageBtn(histPage <= 1)}>← Anterior</button>
                  <span style={{ fontSize: 13, color: "#9A7055" }}>{histData.meta.current_page} / {histData.meta.last_page}</span>
                  <button disabled={histPage >= histData.meta.last_page} onClick={() => setHistPage(p => p + 1)} style={pageBtn(histPage >= histData.meta.last_page)}>Siguiente →</button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ── Tarjeta del tablero ───────────────────────────────────────────────────────
function Card({
  o, colKey, showSede, sedeName, onDragStart, onMove,
}: {
  o: AdminOrder;
  colKey: ColKey;
  showSede: boolean;
  sedeName: string | null;
  onDragStart: () => void;
  onMove: (o: AdminOrder, status: "pending" | "seen" | "served" | "billed" | "dismissed") => void;
}) {
  return (
    <div
      className="cccard"
      draggable
      onDragStart={onDragStart}
      style={{
        background: "#FFFFFF", borderRadius: 12, padding: "12px 13px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.07)", cursor: "grab",
        borderLeft: `4px solid ${o.type === "call" ? "#C8A97E" : o.status === "pending" ? "#3E7C4F" : "#E8E0D8"}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div>
          <div style={{ fontWeight: 700, color: "#1C0F05", fontSize: 14.5, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {o.table_label}
            {o.type === "call" && <span style={{ fontSize: 11, color: "#9A7055" }}>🔔 Llamada</span>}
            {o.status === "pending" && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 999, background: "#ECFDF5", color: "#059669" }}>NUEVO</span>
            )}
            {o.abuse_flag && (
              <span title={`${o.abuse_count} descartes recientes`} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 6, background: "#FEF2F2", color: "#DC2626" }}>⚠</span>
            )}
          </div>
          <div style={{ fontSize: 11.5, color: "#B0A090", marginTop: 2 }}>
            {timeAgo(o.created_at)} · #{o.id}
            {showSede && sedeName && <span style={{ marginLeft: 5, color: "#9A7055" }}>· 🏪 {sedeName}</span>}
          </div>
        </div>
        {o.total > 0 && <div style={{ fontWeight: 700, color: "#6F4E37", fontSize: 14, whiteSpace: "nowrap" }}>{money(o.total)}</div>}
      </div>

      {o.items.length > 0 && (
        <ul style={{ margin: "10px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 3 }}>
          {o.items.map((it, i) => (
            <li key={i} style={{ fontSize: 13, color: "#3D2B1C" }}>
              <strong>{it.quantity}×</strong> {it.name}
              {it.sugar_level && (
                <span style={{ marginLeft: 5, fontSize: 10.5, fontWeight: 600, padding: "1px 6px", borderRadius: 999, background: "#F4EAD9", color: "#6F4E37" }}>🍬 {it.sugar_level}</span>
              )}
              {it.notes && <em style={{ color: "#9A7055" }}> — {it.notes}</em>}
            </li>
          ))}
        </ul>
      )}
      {o.note && <p style={{ fontSize: 12.5, color: "#9A7055", margin: "8px 0 0", fontStyle: "italic" }}>“{o.note}”</p>}

      {/* Acciones (para tablet/táctil, donde arrastrar es incómodo) */}
      <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
        {colKey === "todo" && (
          <>
            <button onClick={() => onMove(o, "seen")} style={mini("#D98E04")}>Preparar →</button>
            <button onClick={() => onMove(o, "dismissed")} style={mini("#DC2626", true)}>✕</button>
          </>
        )}
        {colKey === "prep" && (
          <>
            <button onClick={() => onMove(o, "pending")} style={mini("#9A7055", true)}>←</button>
            <button onClick={() => onMove(o, "served")} style={mini("#3E7C4F")}>Servir →</button>
            <button onClick={() => onMove(o, "dismissed")} style={mini("#DC2626", true)}>✕</button>
          </>
        )}
        {colKey === "served" && (
          <>
            <button onClick={() => onMove(o, "seen")} style={mini("#9A7055", true)}>←</button>
            <button onClick={() => onMove(o, "billed")} style={mini("#6F4E37")}>Facturar →</button>
          </>
        )}
        {colKey === "billed" && (
          <button onClick={() => onMove(o, "served")} style={mini("#9A7055", true)}>← Servido</button>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: AdminOrder["status"] }) {
  const map: Record<string, [string, string, string]> = {
    pending:   ["Pendiente", "#ECFDF5", "#059669"],
    seen:      ["Visto",     "#EFF6FF", "#3B82F6"],
    served:    ["Servido",   "#FBF3E8", "#C8893E"],
    billed:    ["Facturado", "#F4EAD9", "#6F4E37"],
    dismissed: ["Descartado","#FEF2F2", "#DC2626"],
    expired:   ["Expirado",  "#F9F5F2", "#B0A090"],
  };
  const [label, bg, color] = map[status] ?? [status, "#F9F5F2", "#999"];
  return <span style={{ display: "inline-block", marginTop: 4, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color }}>{label}</span>;
}

const mini = (color: string, outline = false): React.CSSProperties => ({
  padding: "6px 11px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
  border: `1px solid ${color}`, background: outline ? "transparent" : color, color: outline ? color : "#FFFFFF",
});

const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontSize: 13.5, fontWeight: 600,
  border: active ? "1px solid #6F4E37" : "1px solid #E8E0D8",
  background: active ? "#6F4E37" : "#FFFFFF",
  color: active ? "#FFFFFF" : "#6B5744",
});

const chip = (active: boolean): React.CSSProperties => ({
  padding: "7px 14px", borderRadius: 999, cursor: "pointer", fontSize: 13, fontWeight: 500,
  border: active ? "1px solid #6F4E37" : "1px solid #E8E0D8",
  background: active ? "#6F4E37" : "#FFFFFF",
  color: active ? "#FFFFFF" : "#6B5744",
});

const pageBtn = (disabled: boolean): React.CSSProperties => ({
  padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500,
  border: "1px solid #E8E0D8", background: "#FFFFFF", color: disabled ? "#CDBFB0" : "#6B5744",
  cursor: disabled ? "not-allowed" : "pointer",
});
