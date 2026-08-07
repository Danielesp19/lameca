"use client";

import { useEffect, useState, useCallback, FormEvent } from "react";
import Link from "next/link";
import {
  adminGetCategories, adminCreateCategory,
  adminUpdateCategory, adminDeleteCategory, adminReorderCategories, AdminCategory,
  adminGetItems, adminReorderItems, adminDeleteItem, AdminItem,
} from "@/lib/admin-api";
import { getSedes } from "@/lib/orders-api";
import SedeLinks from "@/components/admin/SedeLinks";
import type { SedeInfo } from "@/lib/table-session";

// Categoría protegida: destino de productos huérfanos. No se puede
// renombrar ni borrar (el backend también lo bloquea; esto solo evita
// mostrar controles que fallarían igual).
const OTROS_SLUG = "otros";

// Categorías con vitrina especial (Cafés de origen, Métodos): en la carta se
// pintan a pantalla completa con fondo oscuro en vez de como lista, y no
// salen como pestaña del filtro. No se pueden eliminar, y se destacan
// visualmente en esta lista.
function esVitrinaEspecial(cat: AdminCategory): boolean {
  return cat.display_mode === "vertical" || cat.display_mode === "horizontal";
}

// ─── Controles de orden (↑↓) reutilizados en categorías y productos ───────────
// Antes eran dos cuadraditos sueltos lado a lado; esta versión los agrupa en
// una sola píldora con flechitas más finas (SVG, no el carácter ↑↓ que varía
// de grosor según la fuente del sistema) — se ve más como un control y menos
// como dos botones desperdigados.
function ChevronIcon({ dir }: { dir: "up" | "down" }) {
  return (
    <svg width="11" height="7" viewBox="0 0 11 7" fill="none" aria-hidden="true">
      <path d={dir === "up" ? "M1 6L5.5 1.5L10 6" : "M1 1L5.5 5.5L10 1"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function OrderButtons({ onUp, onDown, upDisabled, downDisabled, className = "" }: {
  onUp: () => void; onDown: () => void; upDisabled: boolean; downDisabled: boolean; className?: string;
}) {
  const btnClass = "w-9 h-9 md:w-7 md:h-7 flex items-center justify-center bg-[#FDFAF7] hover:enabled:bg-[#F3EAE0] transition-colors";
  return (
    <div className={`inline-flex flex-col rounded-lg overflow-hidden border border-[#E8E0D8] ${className}`}>
      <button type="button" onClick={onUp} disabled={upDisabled} title="Subir" className={btnClass}
        style={{ color: upDisabled ? "#D4C4B4" : "#6B5744", cursor: upDisabled ? "default" : "pointer" }}>
        <ChevronIcon dir="up" />
      </button>
      <div className="h-px bg-[#E8E0D8]" />
      <button type="button" onClick={onDown} disabled={downDisabled} title="Bajar" className={btnClass}
        style={{ color: downDisabled ? "#D4C4B4" : "#6B5744", cursor: downDisabled ? "default" : "pointer" }}>
        <ChevronIcon dir="down" />
      </button>
    </div>
  );
}

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

  const [items, setItems] = useState<AdminItem[]>([]);
  const [sedes, setSedes] = useState<SedeInfo[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [reorderingCatId, setReorderingCatId] = useState<number | null>(null);
  const [itemsErr, setItemsErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, i] = await Promise.all([adminGetCategories(), adminGetItems()]);
      setCats(c);
      setItems(i);
    }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { getSedes().then(setSedes).catch(() => {}); }, []);

  // Mueve un producto hacia arriba/abajo DENTRO de su categoría y persiste el nuevo orden.
  // reorderingCatId se limita a ESTA categoría: mover productos de una no bloquea las demás.
  async function moveItem(catId: number, index: number, dir: -1 | 1) {
    const catItems = items.filter(i => i.menu_category_id === catId);
    const target = index + dir;
    if (target < 0 || target >= catItems.length || reorderingCatId !== null) return;

    const next = [...catItems];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(prev => [...prev.filter(i => i.menu_category_id !== catId), ...next]); // optimista
    setReorderingCatId(catId);
    setItemsErr("");
    try {
      const fresh = await adminReorderItems(next.map(i => i.id));
      setItems(prev => [...prev.filter(i => i.menu_category_id !== catId), ...fresh]);
    } catch (e) {
      setItemsErr((e as Error).message);
      load();                      // revertir desde el servidor
    } finally {
      setReorderingCatId(null);
    }
  }

  async function delItem(item: AdminItem) {
    if (!confirm(`¿Eliminar "${item.name}"?`)) return;
    setItemsErr("");
    try {
      await adminDeleteItem(item.id);
      setItems(prev => prev.filter(i => i.id !== item.id));
      setCats(prev => prev.map(c => c.id === item.menu_category_id
        ? { ...c, items_count: Math.max(0, (c.items_count ?? 1) - 1) }
        : c));
    } catch (e) { setItemsErr((e as Error).message); }
  }

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
    const count = cat.items_count ?? 0;
    const msg = count > 0
      ? `¿Eliminar "${cat.name}"? Sus ${count} producto${count !== 1 ? "s" : ""} se moverán a la categoría "Otros" (no se borran).`
      : `¿Eliminar "${cat.name}"?`;
    if (!confirm(msg)) return;
    try {
      await adminDeleteCategory(cat.id);
      setCats(p => p.filter(c => c.id !== cat.id));
      load(); // refresca conteos (p.ej. "Otros" ahora tiene más productos)
    }
    catch (e) { alert((e as Error).message); }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 md:mb-8">
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1C0F05", fontFamily: "var(--font-serif)", margin: 0 }}>Categorías</h2>
          <p style={{ fontSize: 13, color: "#9A7055", marginTop: 4 }}>
            {cats.length} categoría{cats.length !== 1 ? "s" : ""} · toca una fila para ver sus productos · usa ↑↓ para cambiar el orden en la carta
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B5744", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nombre *</label>
              <input
                style={{ ...input, ...(editing?.slug === OTROS_SLUG ? { background: "#F9F5F2", color: "#B0A090", cursor: "not-allowed" } : {}) }}
                value={formName}
                onChange={e => setFormName(e.target.value)}
                disabled={editing?.slug === OTROS_SLUG}
                required
              />
              {editing?.slug === OTROS_SLUG && (
                <p style={{ fontSize: 11, color: "#9A7055", marginTop: 4 }}>Es la categoría protegida de productos huérfanos: no se puede renombrar.</p>
              )}
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B5744", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Descripción</label>
              <input style={input} value={formDesc} onChange={e => setFormDesc(e.target.value)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B5744", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Presentación</label>
              {/* Dato, no control: la presentación no se elige ni se cambia.
                  Las dos vitrinas son piezas de diseño concretas de la carta
                  (Cafés de origen vertical, Métodos horizontal — cada una con
                  su foto de fondo y su animación), no un formato genérico
                  aplicable a cualquier categoría. El backend también ignora el
                  campo, así que esto no es solo un candado de pantalla. */}
              <div style={{
                ...input,
                display: "flex", alignItems: "center", gap: 8,
                background: "#F9F5F2", color: "#6B5744", cursor: "default",
              }}>
                {editing?.display_mode === "vertical" ? "🔒 Vitrina vertical"
                  : editing?.display_mode === "horizontal" ? "🔒 Vitrina horizontal"
                  : "Normal (en la lista del menú)"}
              </div>
              <p style={{ fontSize: 11, color: "#9A7055", marginTop: 4 }}>
                {editing?.display_mode === "vertical"
                  ? "Cierra la carta con su vitrina de fondo oscuro. No se puede cambiar."
                  : editing?.display_mode === "horizontal"
                  ? "Se muestra como vitrina, un producto a la vez. No se puede cambiar."
                  : "Aparece como pestaña y en el listado, como el resto."}
              </p>
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

      {/* En móvil el contenedor no pinta nada: cada categoría es su propia
          tarjeta blanca separada (ver el wrapper de cada fila más abajo), y si
          el contenedor fuera blanco todas se fundirían en un solo bloque
          continuo. En escritorio sí es una sola tarjeta con filas adentro. */}
      {!loading && !error && (
        <div className="bg-transparent shadow-none rounded-none md:bg-white md:rounded-2xl md:overflow-hidden md:shadow-[0_1px_3px_rgba(0,0,0,0.06)]" style={{ fontSize: 15 }}>
          {/* Encabezado de columnas: solo en escritorio — en móvil cada fila es
              una tarjeta y los rótulos van pegados a cada dato, no hace falta
              una cabecera aparte. */}
          <div className="hidden md:grid md:grid-cols-[72px_1fr_190px_130px] md:items-center gap-4 px-5 py-3 border-b border-[#F0EBE5]">
            {["Orden", "Categoría", "Ver productos", "Acciones"].map(h => (
              <span key={h} className={h === "Ver productos" ? "text-center" : h === "Acciones" ? "text-right" : ""}
                    style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#B0A090" }}>{h}</span>
            ))}
          </div>

          {cats.map((cat, i) => {
            const especial = esVitrinaEspecial(cat);
            const expanded = expandedId === cat.id;
            const toggle = () => { setExpandedId(expanded ? null : cat.id); setItemsErr(""); };
            return (
              // md:contents → en escritorio este wrapper desaparece del layout
              // y sus hijos siguen siendo celdas directas de la tarjeta común.
              // En móvil es la tarjeta individual de la categoría, con su
              // separación del resto.
              <div key={cat.id} className="md:contents mb-3 rounded-2xl overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.07)]">
                {/* Toda la fila es el "botón" de expandir/colapsar productos —
                    antes solo el texto "· ordenar" lo hacía, un target chico y
                    poco obvio, sobre todo con el dedo. Los controles de orden y
                    las acciones cortan la propagación del click para no
                    disparar el toggle sin querer al usarlos. */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={toggle}
                  onKeyDown={e => {
                    if (e.target !== e.currentTarget) return; // ya lo maneja el control enfocado
                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
                  }}
                  className="flex flex-col gap-2.5 md:grid md:grid-cols-[72px_1fr_190px_130px] md:items-center gap-x-4 px-4 py-3.5 md:px-5 md:py-3.5 cursor-pointer hover:bg-[#FBF8F4] transition-colors md:border-t"
                  style={{
                    // El separador entre filas es cosa de escritorio: en móvil
                    // las tarjetas ya se separan solas con el margen.
                    borderTopColor: i === 0 ? "transparent" : "#F9F5F2",
                    background: expanded ? "#FBF8F4" : especial ? "#FBF3E7" : "transparent",
                    // Franja al costado mientras está abierta: ata la fila con
                    // el panel de productos que aparece justo debajo, para que
                    // se lean como una sola cosa y no como dos bloques sueltos.
                    boxShadow: expanded ? "inset 4px 0 0 0 #6F4E37" : "none",
                  }}
                >
                  {/* En móvil, orden y nombre van juntos en una misma línea
                      (flechas a la izquierda, con aire); en escritorio este
                      wrapper se disuelve con md:contents y cada uno vuelve a
                      ser su propia celda del grid. */}
                  <div className="order-1 flex items-center gap-4 md:contents">
                    {/* Orden (↑↓) */}
                    <div className="md:order-1 shrink-0" onClick={e => e.stopPropagation()}>
                      {/* Con la categoría abierta se ocultan sus flechas: abajo ya
                          hay otras flechas (las de ordenar productos) y tener las
                          dos a la vista se presta a mover la categoría creyendo
                          que se mueve un producto. Mover categorías se hace con
                          las demás filas cerradas. */}
                      {expanded ? null : (
                        <OrderButtons
                          onUp={() => move(i, -1)} onDown={() => move(i, 1)}
                          upDisabled={i === 0 || reordering} downDisabled={i === cats.length - 1 || reordering}
                        />
                      )}
                    </div>

                    {/* Nombre + badge, con la descripción debajo en chiquito: ya
                        no es una columna propia — se comía ancho que le sirve
                        más a "Productos", y para categorías sin descripción
                        (p.ej. "Otros") dejaba un hueco raro en la fila. */}
                    <div className="md:order-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap" style={{ fontSize: 16.5, fontWeight: 600, color: "#1C0F05" }}>
                        {cat.name}
                        {especial && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                            color: "#9A5B21", background: "#F3DFC1", padding: "2px 8px", borderRadius: 999,
                          }}>
                            {cat.display_mode === "vertical" ? "Vitrina vertical" : "Vitrina horizontal"}
                          </span>
                        )}
                      </div>
                      {cat.description && (
                        <div className="line-clamp-1 mt-0.5" style={{ fontSize: 12.5, color: "#A89684" }}>
                          {cat.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Productos: PÍLDORA con borde, no texto suelto. Antes el
                      contador y su flechita se leían igual que "Editar" (todo
                      texto plano en la misma banda), así que no se distinguía
                      qué desplegaba la lista y qué abría el formulario. Con
                      forma de botón, la acción de desplegar se ve. */}
                  <div className="order-3 md:order-3 flex md:justify-center">
                    <span
                      className="inline-flex items-center gap-2 transition-colors"
                      style={{
                        padding: "7px 14px", borderRadius: 999,
                        border: `1.5px solid ${expanded ? "#6F4E37" : "#E8E0D8"}`,
                        background: expanded ? "#6F4E37" : "#FDFAF7",
                        color: expanded ? "#FFFFFF" : "#6F4E37",
                        fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap",
                      }}
                    >
                      {cat.items_count ?? 0} producto{(cat.items_count ?? 0) !== 1 ? "s" : ""}
                      <span style={{ fontSize: 11, lineHeight: 1, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 160ms" }}>▼</span>
                    </span>
                  </div>

                  {/* Acciones: botones de verdad, con su propio recuadro y
                      separados de la píldora de arriba. Eliminar queda en un
                      tono apagado hasta que se pasa por encima: es destructivo
                      y no debe competir por la atención con Editar. */}
                  <div className="order-4 md:order-4 flex items-center gap-2 md:justify-end" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => startEdit(cat)}
                      className="inline-flex items-center gap-1.5 hover:bg-[#F5EDE5] transition-colors"
                      style={{
                        padding: "7px 14px", borderRadius: 9, cursor: "pointer",
                        border: "1.5px solid #E8E0D8", background: "#FFFFFF",
                        color: "#6F4E37", fontSize: 13.5, fontWeight: 600,
                      }}
                    >
                      <span aria-hidden="true">✎</span> Editar
                    </button>
                    {cat.slug === OTROS_SLUG ? (
                      <span style={{ fontSize: 12.5, color: "#B0A090" }} title="Destino de productos huérfanos: no se puede eliminar">Protegida</span>
                    ) : especial ? (
                      <span style={{ fontSize: 12.5, color: "#B0A090" }} title="Tiene vitrina especial en la carta: no se puede eliminar (sí se puede mover y editar)">Protegida</span>
                    ) : (
                      <button
                        onClick={() => del(cat)}
                        title="Eliminar categoría"
                        aria-label="Eliminar categoría"
                        className="inline-flex items-center justify-center hover:bg-[#FEF2F2] hover:border-[#FECACA] transition-colors"
                        style={{
                          width: 34, height: 34, borderRadius: 9, cursor: "pointer",
                          border: "1.5px solid #F0EBE5", background: "#FFFFFF",
                          color: "#DC2626", fontSize: 15,
                        }}
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </div>

                {expanded && (() => {
                  const catItems = items.filter(it => it.menu_category_id === cat.id);
                  return (
                    <div className="px-4 pb-4 md:px-5 md:pb-[18px]" style={{ background: "#FBF8F4" }}>
                      <div style={{ border: "1.5px solid #F0EBE5", borderRadius: 12, overflow: "hidden", background: "#FFFFFF" }}>
                        <div className="flex flex-wrap items-center justify-between gap-3" style={{ padding: "12px 18px", borderBottom: "1px solid #F0EBE5" }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#6B5744", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Productos de &quot;{cat.name}&quot;
                          </span>
                          <span className="flex items-center gap-3">
                            {reorderingCatId === cat.id && <span style={{ fontSize: 12, color: "#9A7055", fontWeight: 500 }}>Guardando…</span>}
                            {/* Azul (no el café del resto del panel): es la acción
                                principal de esta caja y se busca de un vistazo —
                                el contraste con la paleta cálida la hace evidente. */}
                            <Link
                              href={`/admin/items/new?category=${cat.id}`}
                              className="hover:bg-[#1D4ED8] transition-colors"
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                fontSize: 14.5, fontWeight: 600, color: "#FFFFFF",
                                background: "#2563EB", padding: "10px 18px",
                                borderRadius: 10, textDecoration: "none",
                                boxShadow: "0 1px 3px rgba(37,99,235,0.35)",
                              }}
                            >
                              + Nuevo producto
                            </Link>
                          </span>
                        </div>
                        {itemsErr && (
                          <p style={{ fontSize: 13, color: "#DC2626", padding: "8px 18px 0", margin: 0 }}>{itemsErr}</p>
                        )}
                        {catItems.length === 0 ? (
                          <p style={{ padding: "18px", fontSize: 14, color: "#B0A090", margin: 0 }}>Esta categoría no tiene productos.</p>
                        ) : (
                          <div>
                            {catItems.map((item, ii) => (
                              <div
                                key={item.id}
                                className="flex flex-wrap items-center gap-3 md:gap-4"
                                style={{
                                  padding: "14px 18px",
                                  borderTop: ii === 0 ? "none" : "1px solid #F9F5F2",
                                }}
                              >
                                <OrderButtons
                                  onUp={() => moveItem(cat.id, ii, -1)} onDown={() => moveItem(cat.id, ii, 1)}
                                  upDisabled={ii === 0 || reorderingCatId !== null}
                                  downDisabled={ii === catItems.length - 1 || reorderingCatId !== null}
                                />
                                {/* Nombre del producto: la fila principal de lo que
                                    el admin más necesita leer rápido — más grande y
                                    con más peso que el resto de los datos de la fila. */}
                                <span style={{
                                  fontSize: 16.5, fontWeight: 600, flex: "1 1 140px",
                                  color: item.is_available ? "#1C0F05" : "#B0A090",
                                  textDecoration: item.is_available ? "none" : "line-through",
                                }}>
                                  {item.name}
                                </span>
                                {/* Sin esto, apagar "Disponible en carta" hacía
                                    desaparecer el producto de la carta sin que
                                    la lista del panel diera ninguna pista de
                                    por qué. */}
                                {!item.is_available && (
                                  <span style={{
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
                                    color: "#B45309", background: "#FEF3C7", padding: "4px 10px", borderRadius: 999,
                                  }}>
                                    Oculto en la carta
                                  </span>
                                )}
                                {item.is_featured && (
                                  <span style={{
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
                                    color: "#9A5B21", background: "#F3DFC1", padding: "4px 10px", borderRadius: 999,
                                  }}>
                                    ★ Destacado
                                  </span>
                                )}
                                {/* Solo se avisa cuando el producto NO está en
                                    todas las sedes: marcar "está en las dos"
                                    en cada fila sería ruido, porque es el caso
                                    normal. */}
                                {sedes.length > 1 && item.sede_ids && item.sede_ids.length > 0
                                  && item.sede_ids.length < sedes.length && (
                                  <span style={{
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
                                    color: "#1D4ED8", background: "#DBEAFE", padding: "4px 10px", borderRadius: 999,
                                  }}>
                                    Solo {sedes.filter(x => item.sede_ids!.includes(x.id)).map(x => x.name).join(", ")}
                                  </span>
                                )}
                                {/* Mismos botones que en la fila de categoría:
                                    con recuadro, y el destructivo reducido a
                                    un icono apagado para que no compita. */}
                                <Link
                                  href={`/admin/items/${item.id}/edit`}
                                  className="inline-flex items-center gap-1.5 hover:bg-[#F5EDE5] transition-colors"
                                  style={{
                                    padding: "6px 13px", borderRadius: 9,
                                    border: "1.5px solid #E8E0D8", background: "#FFFFFF",
                                    color: "#6F4E37", fontSize: 13, fontWeight: 600, textDecoration: "none",
                                  }}
                                >
                                  <span aria-hidden="true">✎</span> Editar
                                </Link>
                                <button
                                  onClick={() => delItem(item)}
                                  title={`Eliminar ${item.name}`}
                                  aria-label={`Eliminar ${item.name}`}
                                  className="inline-flex items-center justify-center hover:bg-[#FEF2F2] hover:border-[#FECACA] transition-colors"
                                  style={{
                                    width: 32, height: 32, borderRadius: 9, cursor: "pointer",
                                    border: "1.5px solid #F0EBE5", background: "#FFFFFF",
                                    color: "#DC2626", fontSize: 14,
                                  }}
                                >
                                  🗑
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Cerrar sin tener que volver a subir hasta la fila de
                            la categoría — con una lista larga de productos esa
                            fila queda fuera de pantalla. */}
                        <div style={{ borderTop: "1px solid #F0EBE5", padding: "12px 18px" }}>
                          <button
                            onClick={toggle}
                            className="hover:bg-[#EFF6FF] transition-colors"
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 7,
                              fontSize: 14.5, fontWeight: 600, color: "#2563EB",
                              background: "none", border: "1.5px solid #2563EB",
                              padding: "9px 18px", borderRadius: 10, cursor: "pointer",
                            }}
                          >
                            <span style={{ fontSize: 12 }}>▲</span> Ver menos
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
          {cats.length === 0 && (
            <p style={{ padding: "48px 20px", textAlign: "center", color: "#B0A090", fontSize: 14 }}>No hay categorías.</p>
          )}
        </div>
      )}

      {/* Al final: se consulta una vez para imprimir los QR y después no se
          vuelve a mirar — arriba solo estorbaba al trabajo diario, que es
          editar la carta. */}
      <SedeLinks />
    </div>
  );
}
