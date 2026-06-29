"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { mintSession } from "@/lib/orders-api";
import { saveSession } from "@/lib/table-session";

const DARK = "#241a12";
const CREAM = "#F2ECE1";

export default function TableSessionMinter({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await mintSession(token);
      if (!alive) return;
      if (!res) { setError(true); return; }
      saveSession({
        session: res.session,
        exp: Date.now() + res.expires_in * 1000,
        table: res.table,
        sede: res.sede,
      });
      // Redirigimos al menú; el token queda fuera de la URL pública.
      router.replace("/menu");
    })();
    return () => { alive = false; };
  }, [token, router]);

  return (
    <main style={{
      minHeight: "100dvh", background: CREAM, color: DARK,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 18, padding: 24, fontFamily: "var(--font-sans)", textAlign: "center",
    }}>
      {error ? (
        <>
          <span style={{ fontSize: 48 }}>☕</span>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 24, margin: 0 }}>Mesa no válida</h1>
          <p style={{ fontSize: 14, opacity: 0.7, maxWidth: 300 }}>
            Este QR no está activo. Pide ayuda a un mesero o explora la carta.
          </p>
          <button
            onClick={() => router.replace("/menu")}
            style={{
              marginTop: 6, padding: "12px 26px", borderRadius: 999, border: "none",
              background: DARK, color: CREAM, fontSize: 13, fontWeight: 600, cursor: "pointer",
              letterSpacing: "0.08em", textTransform: "uppercase",
            }}
          >
            Ver la carta
          </button>
        </>
      ) : (
        <>
          <motion.span
            animate={{ rotate: [0, 12, -12, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            style={{ fontSize: 48 }}
          >
            ☕
          </motion.span>
          <p style={{ fontSize: 15, fontWeight: 500 }}>Abriendo tu mesa…</p>
        </>
      )}
    </main>
  );
}
