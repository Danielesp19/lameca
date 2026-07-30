import { redirect } from "next/navigation";

// La gestión de productos vive dentro de Categorías (cada categoría se
// expande para ordenar/editar/borrar sus productos) — este puente es solo
// para cualquier enlace o marcador viejo que apunte a /admin/items.
export default function ItemsRedirect() {
  redirect("/admin/categories");
}
