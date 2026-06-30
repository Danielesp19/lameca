"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AdminItem, AdminCategory,
  adminGetCategories, adminCreateItem, adminUpdateItem,
} from "@/lib/admin-api";

// Tope de peso para el video del producto. Un clip de menú comprimido (480–720p,
// sin audio) pesa unos cientos de KB; 15 MB deja margen de sobra y evita subir
// videos crudos del celular que saturan el backend.
const MAX_VIDEO_MB = 15;

// ─── Client-side image compression (Canvas API, no library needed) ────────────
// Resizes to max 1200px wide, converts to JPEG @85% → typically 80–350 KB
async function compressImage(file: File): Promise<File> {
  return new Promise(resolve => {
    const img = new Image();
    const src = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1920;
      let { width, height } = img;
      if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }

      const canvas = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(src);

      canvas.toBlob(
        blob => {
          if (!blob) { resolve(file); return; }
          const name = file.name.replace(/\.[^.]+$/, ".jpg");
          resolve(new File([blob], name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.95,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(src); resolve(file); };
    img.src = src;
  });
}

// ─── Image slot types ─────────────────────────────────────────────────────────
type ImgSlot =
  | { kind: "keep_cover"; url: string }
  | { kind: "existing_extra"; id: number; url: string }
  | { kind: "new_file"; file: File; preview: string; sizeKb: number };

// ─── Shared styles ────────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  borderRadius: 10, border: "1.5px solid #E8E0D8",
  fontSize: 14, color: "#1C0F05", outline: "none",
  background: "#FFFFFF", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600,
  letterSpacing: "0.05em", textTransform: "uppercase",
  color: "#6B5744", marginBottom: 6,
};
const card: React.CSSProperties = {
  background: "#FFFFFF", borderRadius: 16, padding: "24px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
};
const cardTitle: React.CSSProperties = {
  fontSize: 15, fontWeight: 700, color: "#1C0F05",
  marginBottom: 20, paddingBottom: 14,
  borderBottom: "1px solid #F0EBE5",
};

// ─── Single image row ─────────────────────────────────────────────────────────
function ImageRow({
  slot, index, total,
  onMoveUp, onMoveDown, onDelete,
}: {
  slot: ImgSlot;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  const isPortada = index === 0;
  const isNew     = slot.kind === "new_file";
  const previewSrc = slot.kind === "new_file" ? slot.preview : slot.url;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 14px", borderRadius: 10,
      background: isNew ? "#F0FDF4" : "#FDFAF7",
      border: `1.5px solid ${isNew ? "#BBF7D0" : isPortada ? "#BFDBFE" : "#F0EBE5"}`,
      transition: "background 150ms",
    }}>

      {/* Thumbnail */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={previewSrc}
        alt=""
        style={{
          width: 80, height: 60, objectFit: "cover",
          borderRadius: 8, flexShrink: 0,
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      />

      {/* Badges */}
      <div style={{ flex: 1, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        {isPortada && (
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
            background: "#EFF6FF", color: "#3B82F6",
            padding: "3px 9px", borderRadius: 4,
          }}>
            PORTADA
          </span>
        )}
        {isNew && (
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
            background: "#F0FDF4", color: "#16A34A",
            padding: "3px 9px", borderRadius: 4,
          }}>
            NUEVA
          </span>
        )}
        {isNew && slot.kind === "new_file" && (
          <span style={{ fontSize: 12, color: "#6B5744", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
            {slot.file.name}
            <span style={{ color: "#16A34A", marginLeft: 6, fontWeight: 600 }}>
              {slot.sizeKb < 1024
                ? `${slot.sizeKb} KB`
                : `${(slot.sizeKb / 1024).toFixed(1)} MB`}
            </span>
          </span>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        <button
          type="button"
          title="Mover arriba"
          disabled={index === 0}
          onClick={onMoveUp}
          style={{
            width: 30, height: 30, borderRadius: 6, border: "1px solid #E8E0D8",
            background: "none", cursor: index === 0 ? "default" : "pointer",
            fontSize: 14, color: index === 0 ? "#D4C4B4" : "#6B5744",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          ↑
        </button>
        <button
          type="button"
          title="Mover abajo"
          disabled={index === total - 1}
          onClick={onMoveDown}
          style={{
            width: 30, height: 30, borderRadius: 6, border: "1px solid #E8E0D8",
            background: "none", cursor: index === total - 1 ? "default" : "pointer",
            fontSize: 14, color: index === total - 1 ? "#D4C4B4" : "#6B5744",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          ↓
        </button>
        <button
          type="button"
          title="Eliminar"
          onClick={onDelete}
          style={{
            width: 30, height: 30, borderRadius: 6, border: "1px solid #FEE2E2",
            background: "none", cursor: "pointer",
            fontSize: 16, color: "#DC2626", lineHeight: 1,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────
export default function ItemForm({ item }: { item?: AdminItem }) {
  const router      = useRouter();
  const isEdit      = Boolean(item);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animInputRef = useRef<HTMLInputElement>(null);

  // Basic fields
  const [cats,        setCats]        = useState<AdminCategory[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [name,        setName]        = useState(item?.name        ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price,       setPrice]       = useState(String(item?.price ?? ""));
  const [categoryId,  setCategoryId]  = useState(String(item?.menu_category_id ?? ""));
  const [isAvailable, setIsAvailable] = useState(item?.is_available ?? true);
  const [isFeatured,  setIsFeatured]  = useState(item?.is_featured  ?? false);
  const [caffeine,    setCaffeine]    = useState<string>(item?.caffeine_level != null ? String(item.caffeine_level) : "");
  const [hasSugar,    setHasSugar]    = useState(item?.has_sugar_option ?? true);

  // Image list state
  const [imgList, setImgList] = useState<ImgSlot[]>(() => {
    const list: ImgSlot[] = [];
    if (item?.image_url) {
      list.push({ kind: "keep_cover", url: item.image_url });
    }
    for (const img of (item?.extra_images ?? [])) {
      list.push({ kind: "existing_extra", id: img.id, url: img.url });
    }
    return list;
  });
  const [deletedExtraIds, setDeletedExtraIds] = useState<number[]>([]);

  // Hover animation
  const [animFile,   setAnimFile]   = useState<File | null>(null);
  const [deleteAnim, setDeleteAnim] = useState(false);

  useEffect(() => {
    adminGetCategories().then(setCats).catch(() => {});
  }, []);

  // ── Image list ops ────────────────────────────────────────────────────────
  async function addFiles(files: FileList | null) {
    if (!files) return;
    const remaining = 4 - imgList.length;
    if (remaining <= 0) return;
    const toAdd = Array.from(files).slice(0, remaining);

    const compressed = await Promise.all(toAdd.map(compressImage));
    setImgList(prev => [
      ...prev,
      ...compressed.map(f => ({
        kind: "new_file" as const,
        file: f,
        preview: URL.createObjectURL(f),
        sizeKb: Math.round(f.size / 1024),
      })),
    ]);
  }

  function removeImg(i: number) {
    const slot = imgList[i];
    if (slot.kind === "existing_extra") {
      setDeletedExtraIds(prev => [...prev, slot.id]);
    }
    if (slot.kind === "new_file") {
      URL.revokeObjectURL(slot.preview);
    }
    setImgList(prev => prev.filter((_, idx) => idx !== i));
  }

  function moveUp(i: number) {
    if (i === 0) return;
    setImgList(prev => {
      const next = [...prev];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });
  }

  function moveDown(i: number) {
    setImgList(prev => {
      if (i >= prev.length - 1) return prev;
      const next = [...prev];
      [next[i + 1], next[i]] = [next[i], next[i + 1]];
      return next;
    });
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("name",             name);
      fd.append("description",      description);
      fd.append("price",            price);
      fd.append("menu_category_id", categoryId);
      fd.append("is_available",     isAvailable ? "1" : "0");
      fd.append("is_featured",      isFeatured  ? "1" : "0");
      fd.append("has_sugar_option", hasSugar    ? "1" : "0");
      if (caffeine !== "") fd.append("caffeine_level", caffeine);

      // ── Images ─────────────────────────────────────────────────────────────
      if (isEdit) {
        fd.append("images_managed", "1");
        deletedExtraIds.forEach(id => fd.append("delete_extra_ids[]", String(id)));

        const newFiles: File[] = [];
        imgList.forEach(slot => {
          if (slot.kind === "keep_cover") {
            fd.append("image_slots[]", "keep_cover");
          } else if (slot.kind === "existing_extra") {
            fd.append("image_slots[]", `extra:${slot.id}`);
          } else {
            fd.append("image_slots[]", `new:${newFiles.length}`);
            newFiles.push(slot.file);
          }
        });
        newFiles.forEach(f => fd.append("new_images[]", f));
      } else {
        // Create: just send all files in order
        const newFiles = imgList
          .filter((s): s is Extract<ImgSlot, { kind: "new_file" }> => s.kind === "new_file")
          .map(s => s.file);
        newFiles.forEach(f => fd.append("new_images[]", f));
      }

      // ── Video ──────────────────────────────────────────────────────────────
      if (deleteAnim) fd.append("delete_anim", "1");
      if (animFile)   fd.append("video", animFile);

      isEdit ? await adminUpdateItem(item!.id, fd) : await adminCreateItem(fd);
      router.push("/admin/items");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const hasAnim   = Boolean(item?.video_url);
  const animLabel = "Video corto (MP4/WebM)";
  const canAddMore  = imgList.length < 4;

  return (
    <form onSubmit={submit} style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Información básica ── */}
      <div style={card}>
        <div style={cardTitle}>Información básica</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={lbl}>Nombre *</label>
            <input style={inp} value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label style={lbl}>Descripción</label>
            <textarea style={{ ...inp, minHeight: 80, resize: "vertical" }} value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={lbl}>Precio (COP) *</label>
              <input type="number" min="0" step="100" style={inp} value={price} onChange={e => setPrice(e.target.value)} required />
            </div>
            <div>
              <label style={lbl}>Categoría *</label>
              <select style={{ ...inp, cursor: "pointer" }} value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                <option value="">Selecciona…</option>
                {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={lbl}>Nivel de cafeína</label>
            <select style={{ ...inp, cursor: "pointer" }} value={caffeine} onChange={e => setCaffeine(e.target.value)}>
              <option value="">— No mostrar —</option>
              <option value="0">🌿 Sin cafeína</option>
              <option value="1">☕ Baja</option>
              <option value="2">☕☕ Media</option>
              <option value="3">☕☕☕ Alta</option>
            </select>
            <p style={{ fontSize: 12, color: "#9A7055", marginTop: 6 }}>
              Se muestra con emojis en la carta y en el detalle del producto.
            </p>
          </div>
        </div>
      </div>

      {/* ── Fotos ── */}
      <div style={card}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          style={{ display: "none" }}
          onChange={e => { addFiles(e.target.files); e.target.value = ""; }}
        />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #F0EBE5" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1C0F05" }}>
            Fotos del producto
            <span style={{ fontSize: 13, fontWeight: 400, color: "#9A7055", marginLeft: 8 }}>
              {imgList.length}/4
            </span>
          </div>
          {canAddMore && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: "7px 16px", borderRadius: 8,
                border: "1.5px solid #6F4E37", background: "none",
                fontSize: 13, color: "#6F4E37", cursor: "pointer", fontWeight: 600,
              }}
            >
              + Agregar foto
            </button>
          )}
        </div>

        <p style={{ fontSize: 13, color: "#9A7055", marginBottom: 16, lineHeight: 1.6 }}>
          La <strong>primera foto es la portada</strong> — la que aparece en la carta. Usa las flechas ↑↓ para reordenar. Máximo 4 fotos.
        </p>

        {imgList.length === 0 ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: "100%", padding: "36px 0",
              borderRadius: 12, border: "2px dashed #E8E0D8",
              background: "#FDFAF7", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
              color: "#B0A090", fontSize: 14,
            }}
          >
            <span style={{ fontSize: 32 }}>🖼</span>
            <span>Haz clic para agregar fotos</span>
            <span style={{ fontSize: 12 }}>JPG, PNG o WebP · Máximo 4</span>
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {imgList.map((slot, i) => (
              <ImageRow
                key={`${slot.kind}-${slot.kind === "existing_extra" ? slot.id : i}`}
                slot={slot}
                index={i}
                total={imgList.length}
                onMoveUp={() => moveUp(i)}
                onMoveDown={() => moveDown(i)}
                onDelete={() => removeImg(i)}
              />
            ))}

            {canAddMore && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: "11px 0", borderRadius: 10,
                  border: "2px dashed #E8E0D8", background: "none",
                  cursor: "pointer", fontSize: 13, color: "#9A7055",
                  marginTop: 4,
                }}
              >
                + Agregar foto ({imgList.length}/4)
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Animación hover ── */}
      <div style={card}>
        {/* Hidden anim input */}
        <input
          ref={animInputRef}
          type="file"
          accept="video/mp4,video/webm"
          style={{ display: "none" }}
          onChange={e => {
            const f = e.target.files?.[0] ?? null;
            e.target.value = "";
            if (f && f.size > MAX_VIDEO_MB * 1024 * 1024) {
              alert(`El video pesa ${(f.size / 1024 / 1024).toFixed(1)} MB y supera el límite de ${MAX_VIDEO_MB} MB.\n\nComprímelo antes de subirlo (480–720p, sin audio).`);
              return;
            }
            setAnimFile(f);
            if (f) setDeleteAnim(false);
          }}
        />

        <div style={cardTitle}>Video del producto</div>
        <p style={{ fontSize: 13, color: "#9A7055", marginBottom: 16, lineHeight: 1.6 }}>
          Se reproduce automáticamente al hacer scroll. Sube un <strong>video corto MP4 o WebM</strong> (3–8 segundos en loop), <strong>máx {MAX_VIDEO_MB} MB</strong>.
        </p>

        {/* Current animation */}
        {hasAnim && !animFile && !deleteAnim && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
            borderRadius: 10, background: "#FDF4FF", border: "1.5px solid #E9D5FF",
            marginBottom: 14,
          }}>
            <span style={{ fontSize: 20 }}>✨</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#9333EA" }}>{animLabel} actual</span>
              <a
                href={item?.video_url ?? "#"}
                target="_blank"
                rel="noopener"
                style={{ display: "block", fontSize: 11, color: "#9333EA", opacity: 0.7, marginTop: 2 }}
              >
                Ver archivo actual ↗
              </a>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => animInputRef.current?.click()}
                style={{ fontSize: 13, color: "#6F4E37", background: "none", border: "1px solid #E8E0D8", borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}
              >
                Reemplazar
              </button>
              <button
                type="button"
                onClick={() => setDeleteAnim(true)}
                style={{ fontSize: 13, color: "#DC2626", background: "none", border: "1px solid #FEE2E2", borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}
              >
                Eliminar
              </button>
            </div>
          </div>
        )}

        {deleteAnim && !animFile && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
            borderRadius: 10, background: "#FFF7ED", border: "1.5px solid #FED7AA",
            marginBottom: 14, fontSize: 13, color: "#C2410C",
          }}>
            <span>⚠ La animación se eliminará al guardar.</span>
            <button type="button" onClick={() => setDeleteAnim(false)} style={{ color: "#6F4E37", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", marginLeft: "auto" }}>
              Deshacer
            </button>
          </div>
        )}

        {/* New file selected */}
        {animFile ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
            borderRadius: 10, background: "#F0FDF4", border: "1.5px solid #BBF7D0",
          }}>
            <span style={{ fontSize: 16 }}>✓</span>
            <span style={{ fontSize: 13, color: "#16A34A", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {animFile.name}
            </span>
            <button
              type="button"
              onClick={() => setAnimFile(null)}
              style={{ fontSize: 18, color: "#DC2626", background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        ) : !hasAnim || deleteAnim ? (
          <button
            type="button"
            onClick={() => animInputRef.current?.click()}
            style={{
              width: "100%", padding: "20px 0",
              borderRadius: 10, border: "2px dashed #E8E0D8",
              background: "#FDFAF7", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              color: "#9A7055", fontSize: 13,
            }}
          >
            <span style={{ fontSize: 24 }}>✨</span>
            <span>Seleccionar video MP4 o WebM</span>
          </button>
        ) : null}
      </div>

      {/* ── Opciones ── */}
      <div style={card}>
        <div style={cardTitle}>Opciones</div>
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          {([
            ["Disponible en carta", isAvailable, setIsAvailable],
            ["Marcar como destacado ★", isFeatured, setIsFeatured],
            ["Permitir elegir azúcar 🍬", hasSugar, setHasSugar],
          ] as [string, boolean, (v: boolean) => void][]).map(([l, val, set]) => (
            <label key={l} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, color: "#1C0F05" }}>
              <input
                type="checkbox"
                checked={val}
                onChange={e => set(e.target.checked)}
                style={{ accentColor: "#6F4E37", width: 16, height: 16 }}
              />
              {l}
            </label>
          ))}
        </div>
      </div>

      {error && (
        <p style={{ color: "#DC2626", fontSize: 14, padding: "10px 14px", background: "#FFF5F5", borderRadius: 8, border: "1px solid #FED7D7" }}>
          {error}
        </p>
      )}

      {/* ── Actions ── */}
      <div style={{ display: "flex", gap: 12, paddingBottom: 40 }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 32px", borderRadius: 10, border: "none",
            background: loading ? "#C8A97E" : "#6F4E37",
            color: "#FFFFFF", fontSize: 14, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear producto"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/items")}
          style={{
            padding: "12px 20px", borderRadius: 10,
            border: "1.5px solid #E8E0D8", background: "none",
            fontSize: 14, color: "#6B5744", cursor: "pointer",
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
