"use client";

import { useEffect, useState } from "react";

const BG      = "#F7F1E5";
const CHOCO   = "#3E2A1C";
const TERRA   = "#BC5A32";
const COFFEE1 = "#C89A6B";
const COFFEE2 = "#B9895B";

// Splash de entrada: taza que se llena de café + logo + marca. Se muestra una
// vez por sesión (sessionStorage) y se desliza hacia arriba revelando el hero
// con su video — el video ya carga/reproduce detrás mientras dura el splash.
const SEEN_KEY = "lameca_splash_seen";
const TOTAL_MS = 3500; // splashOut arranca a los 2.7s y dura 0.8s

export default function SplashIntro() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem(SEEN_KEY) === "1") {
      setShow(false);
      return;
    }
    sessionStorage.setItem(SEEN_KEY, "1");
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
        alignItems: "center", justifyContent: "center", gap: 30,
        background: BG,
        fontFamily: "var(--font-sans)", color: CHOCO,
        animation: "splashOut 0.8s cubic-bezier(0.7,0,0.3,1) 2.7s forwards",
        pointerEvents: "none",
      }}
    >
      {/* Taza circular que se llena */}
      <div style={{ position: "relative", width: 164, height: 164 }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: `2px solid ${CHOCO}`, overflow: "hidden",
          background: "#FFFCF5",
          boxShadow: "0 22px 50px -22px rgba(62,42,28,0.45)",
        }}>
          {/* Café subiendo con oleaje (dos discos girando) */}
          <div style={{ position: "absolute", inset: 0, animation: "riseFill 2.1s cubic-bezier(0.35,0.6,0.3,1) 0.25s both" }}>
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt=""
            style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              width: 76, height: 76, objectFit: "contain", zIndex: 2,
            }}
          />
        </div>
        {/* Vapor sobre la taza */}
        <div style={{ position: "absolute", top: -38, left: 0, right: 0, height: 60, pointerEvents: "none" }}>
          <span className="wisp" style={{ left: "42%", animationDuration: "3.2s" }} />
          <span className="wisp" style={{ left: "56%", height: 34, animationDuration: "4s", animationDelay: "0.8s" }} />
        </div>
      </div>

      {/* Marca */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <span style={{
          fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 27,
          letterSpacing: "0.3em", paddingLeft: "0.3em",
          animation: "trackIn 1.5s cubic-bezier(0.2,0.7,0.2,1) 0.4s both",
        }}>
          LA MECA
        </span>
        <span style={{ width: 36, height: 1, background: TERRA, display: "block" }} />
        <span style={{
          fontSize: 10, letterSpacing: "0.34em", paddingLeft: "0.34em",
          textTransform: "uppercase", opacity: 0.55,
          animation: "fadeUp 0.8s ease 1s both",
        }}>
          Café de origen
        </span>
      </div>
    </div>
  );
}
