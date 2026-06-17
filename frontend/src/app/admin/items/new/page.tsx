import ItemForm from "@/components/admin/ItemForm";
import Link from "next/link";

export default function NewItemPage() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
        <Link href="/admin/items" style={{ fontSize: 13, color: "#6F4E37", textDecoration: "none" }}>
          ← Productos
        </Link>
        <span style={{ color: "#D4C4B4" }}>/</span>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1C0F05", fontFamily: "var(--font-serif)", margin: 0 }}>
          Nuevo producto
        </h2>
      </div>
      <ItemForm />
    </div>
  );
}
