"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminGetItems, adminDeleteItem, AdminItem } from "@/lib/admin-api";

function Pill({ on, yes, no }: { on: boolean; yes: string; no: string }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 500,
      background: on ? "#ECFDF5" : "#F9F5F2",
      color:      on ? "#059669" : "#B0A090",
    }}>
      {on ? yes : no}
    </span>
  );
}

export default function ItemsPage() {
  const [items,   setItems]   = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setItems(await adminGetItems()); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function del(item: AdminItem) {
    if (!confirm(`¿Eliminar "${item.name}"?`)) return;
    try {
      await adminDeleteItem(item.id);
      setItems(p => p.filter(i => i.id !== item.id));
    } catch (e) { alert((e as Error).message); }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1C0F05", fontFamily: "var(--font-serif)", margin: 0 }}>
            Productos
          </h2>
          <p style={{ fontSize: 13, color: "#9A7055", marginTop: 4 }}>
            {items.length} producto{items.length !== 1 ? "s" : ""} en la carta
          </p>
        </div>
        <Link href="/admin/items/new" style={{
          padding: "10px 20px",
          borderRadius: 10,
          background: "#6F4E37",
          color: "#FFFFFF",
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
        }}>
          + Nuevo producto
        </Link>
      </div>

      {loading && <p style={{ color: "#9A7055", fontSize: 14 }}>Cargando…</p>}
      {error   && <p style={{ color: "#DC2626", fontSize: 14 }}>{error}</p>}

      {!loading && !error && (
        <div style={{ background: "#FFFFFF", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #F0EBE5" }}>
                {["Producto", "Categoría", "Precio", "Media", "Estado", ""].map(h => (
                  <th key={h} style={{
                    textAlign: "left",
                    padding: "12px 20px",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#B0A090",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} style={{ borderTop: i === 0 ? "none" : "1px solid #F9F5F2" }}>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ fontWeight: 600, color: "#1C0F05" }}>{item.name}</div>
                    {item.is_featured && (
                      <span style={{ fontSize: 11, color: "#9A7055", marginTop: 2, display: "block" }}>★ Destacado</span>
                    )}
                  </td>
                  <td style={{ padding: "14px 20px", color: "#6B5744" }}>
                    {item.category_name ?? "—"}
                  </td>
                  <td style={{ padding: "14px 20px", fontWeight: 600, color: "#6F4E37", fontVariantNumeric: "tabular-nums" }}>
                    ${item.price.toLocaleString("es-CO")}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {item.image_url && (
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#EFF6FF", color: "#3B82F6" }}>Foto</span>
                      )}
                      {item.extra_images.length > 0 && (
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#EFF6FF", color: "#3B82F6" }}>
                          +{item.extra_images.length}
                        </span>
                      )}
                      {item.video_url && (
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#FDF4FF", color: "#9333EA" }}>Video</span>
                      )}
                      {!item.image_url && item.extra_images.length === 0 && !item.video_url && (
                        <span style={{ fontSize: 11, color: "#B0A090" }}>Sin media</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <Pill on={item.is_available} yes="Disponible" no="No disp." />
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", gap: 16 }}>
                      <Link href={`/admin/items/${item.id}/edit`} style={{ fontSize: 13, color: "#6F4E37", textDecoration: "none", fontWeight: 500 }}>
                        Editar
                      </Link>
                      <button onClick={() => del(item)} style={{ fontSize: 13, color: "#DC2626", background: "none", border: "none", cursor: "pointer", fontWeight: 500, padding: 0 }}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "48px 20px", textAlign: "center", color: "#B0A090", fontSize: 14 }}>
                    No hay productos.{" "}
                    <Link href="/admin/items/new" style={{ color: "#6F4E37", fontWeight: 600 }}>Crea el primero.</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
