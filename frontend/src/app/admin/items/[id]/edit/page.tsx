"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { adminGetItems, AdminItem } from "@/lib/admin-api";
import ItemForm from "@/components/admin/ItemForm";

export default function EditItemPage() {
  const { id }  = useParams<{ id: string }>();
  const [item,  setItem]  = useState<AdminItem | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminGetItems()
      .then(items => {
        const found = items.find(i => i.id === Number(id));
        if (found) setItem(found);
        else setError("Producto no encontrado");
      })
      .catch(e => setError((e as Error).message));
  }, [id]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
        <Link href="/admin/items" style={{ fontSize: 13, color: "#6F4E37", textDecoration: "none" }}>
          ← Productos
        </Link>
        <span style={{ color: "#D4C4B4" }}>/</span>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1C0F05", fontFamily: "var(--font-serif)", margin: 0 }}>
          {item ? `Editar — ${item.name}` : "Editar producto"}
        </h2>
      </div>

      {error   && <p style={{ color: "#DC2626", fontSize: 14 }}>{error}</p>}
      {!item && !error && <p style={{ color: "#9A7055", fontSize: 14 }}>Cargando…</p>}
      {item    && <ItemForm item={item} />}
    </div>
  );
}
