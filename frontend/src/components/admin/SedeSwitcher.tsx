"use client";

import { useAdminSede } from "@/context/AdminSedeContext";

// Selector global de sede del panel: filtra pedidos y mesas por sede.
export default function SedeSwitcher() {
  const { sedes, current, setCurrent, loading } = useAdminSede();

  if (loading && sedes.length === 0) return null;
  if (sedes.length <= 1) return null; // con una sola sede no tiene sentido el filtro

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, marginBottom: 24,
      background: "#FFFFFF", border: "1px solid #E8E0D8", borderRadius: 12,
      padding: "10px 14px", width: "fit-content",
    }}>
      <span style={{ fontSize: 16 }}>🏪</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#9A7055", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Sede
      </span>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {sedes.map(s => (
          <Chip key={s.id} label={s.name} active={current === s.id} onClick={() => setCurrent(s.id)} />
        ))}
      </div>
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 13px", borderRadius: 999, cursor: "pointer", fontSize: 13, fontWeight: 500,
        border: active ? "1px solid #6F4E37" : "1px solid #E8E0D8",
        background: active ? "#6F4E37" : "#FFFFFF",
        color: active ? "#FFFFFF" : "#6B5744",
      }}
    >
      {label}
    </button>
  );
}
