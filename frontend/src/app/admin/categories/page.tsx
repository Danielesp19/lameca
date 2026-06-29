"use client";

import { useEffect, useState, useCallback, FormEvent } from "react";
import {
  adminGetCategories, adminCreateCategory,
  adminUpdateCategory, adminDeleteCategory, adminReorderCategories, AdminCategory,
} from "@/lib/admin-api";

const input: React.CSSProperties = {
  padding: "9px 13px", borderRadius: 9,
  border: "1.5px solid #E8E0D8", fontSize: 14,
  color: "#1C0F05", outline: "none", background: "#FFFFFF",
  boxSizing: "border-box", width: "100%",
};

export default function CategoriesPage() {
  const [cats,    setCats]    = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [editing, setEditing]   = useState<AdminCategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [saving,   setSaving]   = useState(false);
  const [formErr,  setFormErr]  = useState("");
  const [reordering, setReordering] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setCats(await adminGetCategories()); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function startCreate() { setEditing(null); setFormName(""); setFormDesc(""); setFormErr(""); setCreating(true); }
  function startEdit(c: AdminCategory) { setCreating(false); setEditing(c); setFormName(c.name); setFormDesc(c.description ?? ""); setFormErr(""); }
  function cancel() { setCreating(false); setEditing(null); }

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true); setFormErr("");
    try {
      if (editing) {
        const updated = await adminUpdateCategory(editing.id, { name: formName, description: formDesc || null });
        setCats(prev => prev.map(c => c.id === editing.id ? { ...c, ...updated } : c));
      } else {
        const created = await adminCreateCategory({ name: formName, description: formDesc || null });
        setCats(prev => [...prev, created]);
      }
      cancel();
    } catch (e) { setFormErr((e as Error).message); }
    finally { setSaving(false); }
  }

  // Mueve una categoría hacia arriba/abajo y persiste el nuevo orden.
  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= cats.length || reordering) return;

    const next = [...cats];
    [next[index], next[target]] = [next[target], next[index]];
    setCats(next);                 // optimista
    setReordering(true);
    try {
      const fresh = await adminReorderCategories(next.map(c => c.id));
      setCats(fresh);
    } catch (e) {
      alert((e as Error).message);
      load();                      // revertir desde el servidor
    } finally {
      setReordering(false);
    }
  }

  async function del(cat: AdminCategory) {
    if (!confirm(`¿Eliminar "${cat.name}"? Se borrarán todos sus productos.`)) return;
    try { await adminDeleteCategory(cat.id); setCats(p => p.filter(c => c.id !== cat.id)); }
    catch (e) { alert((e as Error).message); }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1C0F05", fontFamily: "var(--font-serif)", margin: 0 }}>Categorías</h2>
          <p style={{ fontSize: 13, color: "#9A7055", marginTop: 4 }}>
            {cats.length} categoría{cats.length !== 1 ? "s" : ""} · usa ↑↓ para cambiar el orden en la carta
          </p>
        </div>
        {!creating && !editing && (
          <button onClick={startCreate} style={{ padding: "10px 20px", borderRadius: 10, background: "#6F4E37", color: "#FFF", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}>
            + Nueva categoría
          </button>
        )}
      </div>

      {/* Inline form */}
      {(creating || editing) && (
        <form onSubmit={save} style={{ background: "#FFFFFF", borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1.5px solid #F0EBE5" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#6F4E37", marginBottom: 18 }}>
            {editing ? `Editando: ${editing.name}` : "Nueva categoría"}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B5744", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nombre *</label>
              <input style={input} value={formName} onChange={e => setFormName(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B5744", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Descripción</label>
              <input style={input} value={formDesc} onChange={e => setFormDesc(e.target.value)} />
            </div>
          </div>
          {formErr && <p style={{ color: "#DC2626", fontSize: 13, marginBottom: 12 }}>{formErr}</p>}
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" disabled={saving} style={{ padding: "9px 22px", borderRadius: 9, background: saving ? "#C8A97E" : "#6F4E37", color: "#FFF", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
              {saving ? "Guardando…" : editing ? "Guardar" : "Crear"}
            </button>
            <button type="button" onClick={cancel} style={{ padding: "9px 18px", borderRadius: 9, border: "1.5px solid #E8E0D8", background: "none", fontSize: 13, color: "#6B5744", cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading && <p style={{ color: "#9A7055", fontSize: 14 }}>Cargando…</p>}
      {error   && <p style={{ color: "#DC2626", fontSize: 14 }}>{error}</p>}

      {!loading && !error && (
        <div style={{ background: "#FFFFFF", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #F0EBE5" }}>
                {["Orden", "Nombre", "Descripción", "Productos", ""].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 20px", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#B0A090" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cats.map((cat, i) => (
                <tr key={cat.id} style={{ borderTop: i === 0 ? "none" : "1px solid #F9F5F2" }}>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        onClick={() => move(i, -1)}
                        disabled={i === 0 || reordering}
                        title="Subir"
                        style={{
                          width: 28, height: 28, borderRadius: 6, border: "1px solid #E8E0D8",
                          background: "none", cursor: i === 0 || reordering ? "default" : "pointer",
                          fontSize: 13, color: i === 0 ? "#D4C4B4" : "#6B5744",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >↑</button>
                      <button
                        onClick={() => move(i, 1)}
                        disabled={i === cats.length - 1 || reordering}
                        title="Bajar"
                        style={{
                          width: 28, height: 28, borderRadius: 6, border: "1px solid #E8E0D8",
                          background: "none", cursor: i === cats.length - 1 || reordering ? "default" : "pointer",
                          fontSize: 13, color: i === cats.length - 1 ? "#D4C4B4" : "#6B5744",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >↓</button>
                    </div>
                  </td>
                  <td style={{ padding: "14px 20px", fontWeight: 600, color: "#1C0F05" }}>{cat.name}</td>
                  <td style={{ padding: "14px 20px", color: "#6B5744" }}>{cat.description ?? "—"}</td>
                  <td style={{ padding: "14px 20px", color: "#9A7055" }}>{cat.items_count ?? 0}</td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", gap: 16 }}>
                      <button onClick={() => startEdit(cat)} style={{ fontSize: 13, color: "#6F4E37", background: "none", border: "none", cursor: "pointer", fontWeight: 500, padding: 0 }}>Editar</button>
                      <button onClick={() => del(cat)} style={{ fontSize: 13, color: "#DC2626", background: "none", border: "none", cursor: "pointer", fontWeight: 500, padding: 0 }}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {cats.length === 0 && (
                <tr><td colSpan={5} style={{ padding: "48px 20px", textAlign: "center", color: "#B0A090", fontSize: 14 }}>No hay categorías.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
