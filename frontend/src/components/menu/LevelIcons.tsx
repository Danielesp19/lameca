"use client";

// Nivel 0–3 dibujado con emojis repetidos: los "llenos" a color y el resto en
// gris (los emojis no se pueden recolorear, así que el gris se logra con un
// filtro CSS). Nivel 0 muestra el icono de prohibido (sin cafeína / sin azúcar).
export default function LevelIcons({
  level,
  icon,
  max = 3,
  size = 13,
  gap = 1,
}: {
  level: number;
  icon: string;
  max?: number;
  size?: number;
  /** Separación entre iconos en px; negativa = solapados/juntos. */
  gap?: number;
}) {
  if (level <= 0) {
    return <span style={{ fontSize: size, lineHeight: 1 }}>🚫</span>;
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          style={{
            fontSize: size,
            lineHeight: 1,
            marginLeft: i > 0 ? gap : 0,
            filter: i < level ? "none" : "grayscale(1) opacity(0.45)",
          }}
        >
          {icon}
        </span>
      ))}
    </span>
  );
}
