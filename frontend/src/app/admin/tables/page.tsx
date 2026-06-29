"use client";

import { useEffect, useState, useCallback } from "react";
import QRCode from "qrcode";
import {
  adminGetTables, adminCreateTable, adminUpdateTable, adminDeleteTable,
  adminRotateTableToken, AdminTable,
} from "@/lib/admin-api";
import { useAdminSede } from "@/context/AdminSedeContext";

// Base pública del menú (Vercel). En dev cae a window.location.origin.
function siteBase(): string {
  return process.env.NEXT_PUBLIC_SITE_URL
    ?? (typeof window !== "undefined" ? window.location.origin : "");
}

// El QR apunta a /t/<token>: canjea el token por una sesión corta y redirige
// al menú. El token fijo nunca queda en la URL del menú.
function tableUrl(token: string): string {
  return `${siteBase()}/t/${token}`;
}

export default function TablesPage() {
  const { sedes, current } = useAdminSede();
  const [tables, setTables] = useState<AdminTable[]>([]);
  const [qrs, setQrs]       = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [newNumber, setNewNumber] = useState("");
  const [newName, setNewName] = useState("");
  const [newSede, setNewSede] = useState<number | "">("");

  // La sede del formulario sigue a la sede seleccionada arriba (o la primera).
  useEffect(() => {
    setNewSede(current ?? sedes[0]?.id ?? "");
  }, [current, sedes]);

  const renderQrs = useCallback(async (list: AdminTable[]) => {
    const out: Record<number, string> = {};
    await Promise.all(list.map(async t => {
      out[t.id] = await QRCode.toDataURL(tableUrl(t.qr_token), { width: 320, margin: 1 });
    }));
    setQrs(out);
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const list = await adminGetTables(current);
      setTables(list);
      await renderQrs(list);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [renderQrs, current]);

  useEffect(() => { load(); }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!newNumber.trim()) return;
    if (!newSede) { alert("Elige una sede para la mesa."); return; }
    try {
      await adminCreateTable({ sede_id: Number(newSede), number: newNumber.trim(), name: newName.trim() || null });
      setNewNumber(""); setNewName("");
      load();
    } catch (e) { alert((e as Error).message); }
  }

  async function toggle(t: AdminTable) {
    try { await adminUpdateTable(t.id, { is_active: !t.is_active }); load(); }
    catch (e) { alert((e as Error).message); }
  }

  async function del(t: AdminTable) {
    if (!confirm(`¿Eliminar la ${t.label}? Sus pedidos quedarán sin mesa asociada.`)) return;
    try { await adminDeleteTable(t.id); load(); }
    catch (e) { alert((e as Error).message); }
  }

  async function rotate(t: AdminTable) {
    if (!confirm(`Rotar el token de la ${t.label}?\n\nLos QR impresos viejos dejarán de funcionar — deberás reimprimir este.`)) return;
    try { await adminRotateTableToken(t.id); load(); }
    catch (e) { alert((e as Error).message); }
  }

  function download(t: AdminTable) {
    const a = document.createElement("a");
    a.href = qrs[t.id];
    a.download = `mesa-${t.number}.png`;
    a.click();
  }

  function printQr(t: AdminTable) {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html><head><title>QR ${t.label}</title></head>
      <body style="text-align:center;font-family:sans-serif;padding:40px">
        <h1 style="font-size:28px">${t.label}</h1>
        <img src="${qrs[t.id]}" style="width:320px;height:320px" />
        <p style="color:#666;font-size:13px">Escanea para ver el menú y pedir</p>
      </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1C0F05", fontFamily: "var(--font-serif)", margin: 0 }}>Mesas</h2>
        <p style={{ fontSize: 13, color: "#9A7055", marginTop: 4 }}>
          Cada mesa tiene un QR con un token secreto. Imprímelo y colócalo en la mesa.
        </p>
      </div>

      {/* Crear */}
      <form onSubmit={create} style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap", background: "#FFFFFF", padding: 16, borderRadius: 12 }}>
        {sedes.length > 1 && (
          <select value={newSede} onChange={e => setNewSede(e.target.value ? Number(e.target.value) : "")} style={{ ...inp, cursor: "pointer" }}>
            {sedes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <input value={newNumber} onChange={e => setNewNumber(e.target.value)} placeholder="Número (ej. 5)" required
          style={inp} />
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nombre opcional (ej. Terraza)"
          style={{ ...inp, flex: 1, minWidth: 160 }} />
        <button type="submit" style={{ padding: "10px 20px", borderRadius: 10, background: "#6F4E37", color: "#FFF", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          + Agregar mesa
        </button>
      </form>

      {loading && <p style={{ color: "#9A7055", fontSize: 14 }}>Cargando…</p>}
      {error && <p style={{ color: "#DC2626", fontSize: 14 }}>{error}</p>}

      {!loading && !error && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {tables.map(t => (
            <div key={t.id} style={{ background: "#FFFFFF", borderRadius: 14, padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", opacity: t.is_active ? 1 : 0.55 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#1C0F05", fontSize: 17 }}>{t.label}</div>
                  {sedes.length > 1 && t.sede_name && (
                    <div style={{ fontSize: 11.5, color: "#9A7055", marginTop: 2 }}>🏪 {t.sede_name}</div>
                  )}
                </div>
                <button onClick={() => toggle(t)} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, border: "none", cursor: "pointer", background: t.is_active ? "#ECFDF5" : "#F9F5F2", color: t.is_active ? "#059669" : "#B0A090" }}>
                  {t.is_active ? "Activa" : "Inactiva"}
                </button>
              </div>

              {qrs[t.id] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrs[t.id]} alt={`QR ${t.label}`} style={{ width: "100%", maxWidth: 200, display: "block", margin: "14px auto", borderRadius: 8 }} />
              )}

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 12 }}>
                <button onClick={() => download(t)} style={miniBtn}>⬇ PNG</button>
                <button onClick={() => printQr(t)} style={miniBtn}>🖨 Imprimir</button>
              </div>

              <div style={{ display: "flex", gap: 14, justifyContent: "center", borderTop: "1px solid #F0EBE5", paddingTop: 10 }}>
                <button onClick={() => rotate(t)} style={{ fontSize: 12, color: "#B5852A", background: "none", border: "none", cursor: "pointer" }}>↻ Rotar token</button>
                <button onClick={() => del(t)} style={{ fontSize: 12, color: "#DC2626", background: "none", border: "none", cursor: "pointer" }}>Eliminar</button>
              </div>
            </div>
          ))}
          {tables.length === 0 && (
            <p style={{ color: "#B0A090", fontSize: 14 }}>No hay mesas aún. Crea la primera arriba.</p>
          )}
        </div>
      )}
    </div>
  );
}

const inp: React.CSSProperties = {
  padding: "10px 12px", borderRadius: 10, border: "1px solid #E8E0D8",
  fontSize: 14, color: "#3D2B1C", background: "#FFFDF9",
};
const miniBtn: React.CSSProperties = {
  fontSize: 12, padding: "6px 12px", borderRadius: 8, border: "1px solid #E8E0D8",
  background: "#FFFDF9", color: "#6B5744", cursor: "pointer", fontWeight: 500,
};
