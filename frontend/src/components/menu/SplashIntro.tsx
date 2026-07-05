"use client";

import { useEffect, useState } from "react";

const BG      = "#F7F1E5";
const CHOCO   = "#3E2A1C";
const TERRA   = "#BC5A32";
const COFFEE1 = "#C89A6B";
const COFFEE2 = "#B9895B";

// Splash de entrada: taza que se llena de café + logo + marca. Se muestra en
// CADA carga/recarga (feedback del cliente: posiciona la marca) y se desliza
// hacia arriba revelando el hero — el video ya carga/reproduce detrás.
// Ritmo pausado: llenado 2.9s, salida a los 4s (total ~4.8s).
const TOTAL_MS = 4800;

export default function SplashIntro() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShow(false), TOTAL_MS);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed", inset: 0, zIndex: 400,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 34,
        background: BG,
        fontFamily: "var(--font-sans)", color: CHOCO,
        animation: "splashOut 0.85s cubic-bezier(0.7,0,0.3,1) 4s forwards",
        pointerEvents: "none",
        // Aísla el splash del layout de la página que carga detrás: su
        // animación no se ve afectada por reflows del contenido.
        contain: "layout style paint",
      }}
    >
      {/* Taza circular que se llena */}
      <div style={{ position: "relative", width: 216, height: 216 }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: `2px solid ${CHOCO}`, overflow: "hidden",
          background: "#FFFCF5",
          boxShadow: "0 26px 60px -24px rgba(62,42,28,0.45)",
        }}>
          {/* Café subiendo con oleaje (dos discos girando) */}
          <div style={{ position: "absolute", inset: 0, animation: "riseFill 2.9s cubic-bezier(0.35,0.6,0.3,1) 0.35s both" }}>
            <div style={{
              position: "absolute", top: "-128%", left: "-55%",
              width: "210%", height: "210%", borderRadius: "44%",
              background: COFFEE1, animation: "spinWave 5.5s linear infinite",
            }} />
            <div style={{
              position: "absolute", top: "-126%", left: "-50%",
              width: "200%", height: "200%", borderRadius: "46%",
              background: COFFEE2, opacity: 0.65,
              animation: "spinWave 7.5s linear infinite reverse",
            }} />
          </div>
          {/* Halo crema tras el logo: lo separa del café y le da definición */}
          <span style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            width: 152, height: 152, borderRadius: "50%",
            background: "rgba(255,252,245,0.92)",
            boxShadow: "0 4px 24px rgba(62,42,28,0.18)",
            zIndex: 1,
          }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt=""
            width={132}
            height={132}
            fetchPriority="high"
            style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              width: 132, height: 132, objectFit: "contain", zIndex: 2,
            }}
          />
        </div>
        {/* Vapor sobre la taza */}
        <div style={{ position: "absolute", top: -42, left: 0, right: 0, height: 60, pointerEvents: "none" }}>
          <span className="wisp" style={{ left: "42%", animationDuration: "3.2s" }} />
          <span className="wisp" style={{ left: "56%", height: 34, animationDuration: "4s", animationDelay: "0.8s" }} />
        </div>
      </div>

      {/* Marca */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 13 }}>
        <span style={{
          fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 30,
          letterSpacing: "0.3em", paddingLeft: "0.3em",
          animation: "trackIn 1.9s cubic-bezier(0.2,0.7,0.2,1) 0.6s both",
        }}>
          LA MECA
        </span>
        <span style={{ width: 40, height: 1, background: TERRA, display: "block" }} />
        <span style={{
          fontSize: 11, letterSpacing: "0.34em", paddingLeft: "0.34em",
          textTransform: "uppercase", opacity: 0.55,
          animation: "fadeUp 0.9s ease 1.7s both",
        }}>
          Café de origen
        </span>
      </div>
    </div>
  );
}
