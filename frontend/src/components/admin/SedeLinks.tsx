"use client";

import { useEffect, useState } from "react";
import { getSedes } from "@/lib/orders-api";
import type { SedeInfo } from "@/lib/table-session";

/**
 * Enlace público de cada sede, para imprimir su QR.
 *
 * Cada local usa su propia dirección (…/?sede=campestre): quien la escanea cae
 * directo en la carta de ESA sede, sin tener que elegir. Se muestran acá
 * porque no hay dónde más consultarlas — se arman a partir del slug de la sede
 * y el dominio en el que está abierto el panel.
 */
export default function SedeLinks() {
  const [sedes, setSedes] = useState<SedeInfo[]>([]);
  const [origen, setOrigen] = useState("");
  const [copiada, setCopiada] = useState<number | null>(null);

  useEffect(() => {
    setOrigen(window.location.origin);
    getSedes().then(setSedes).catch(() => {});
  }, []);

  // Con una sola sede no hay nada que distinguir: la carta normal ya es la suya.
  if (sedes.length < 2 || !origen) return null;

  const copiar = async (s: SedeInfo, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiada(s.id);
      setTimeout(() => setCopiada(null), 1800);
    } catch {
      // Sin permiso de portapapeles (o HTTP sin TLS): el enlace está a la
      // vista y se puede copiar a mano, así que no se avisa nada.
    }
  };

  return (
    <div style={{
      background: "#FFFFFF", borderRadius: 16, padding: "18px 20px", marginTop: 26,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1.5px solid #F0EBE5",
    }}>
      <div style={{ fontSize: 14.5, fontWeight: 700, color: "#1C0F05", marginBottom: 4 }}>
        Enlace de cada sede (para el QR)
      </div>
      <p style={{ fontSize: 13, color: "#9A7055", margin: "0 0 14px", lineHeight: 1.6 }}>
        Imprime en cada local el QR de <strong>su</strong> enlace: quien lo
        escanea ve directamente la carta de esa sede.
      </p>

      <div className="flex flex-col gap-2.5">
        {sedes.map(s => {
          const url = `${origen}/?sede=${s.slug}`;
          return (
            <div
              key={s.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1.5"
              style={{
                padding: "12px 14px", borderRadius: 12,
                background: "#FDFAF7", border: "1.5px solid #F0EBE5",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: "#1C0F05", minWidth: 130 }}>
                {s.name}
              </span>
              {/* break-all: la URL no debe forzar scroll horizontal en celular */}
              <code style={{
                flex: "1 1 200px", fontSize: 12.5, color: "#6B5744",
                fontFamily: "ui-monospace, monospace", wordBreak: "break-all",
              }}>
                {url}
              </code>
              <button
                onClick={() => copiar(s, url)}
                style={{
                  padding: "7px 14px", borderRadius: 9, cursor: "pointer",
                  border: "none", background: copiada === s.id ? "#16A34A" : "#2563EB",
                  color: "#FFFFFF", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap",
                }}
              >
                {copiada === s.id ? "¡Copiado!" : "Copiar"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
