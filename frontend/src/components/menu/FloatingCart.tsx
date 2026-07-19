"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { createOrder, getSedes, SessionExpiredError } from "@/lib/orders-api";
import type { SedeInfo } from "@/lib/table-session";
import Turnstile, { turnstileEnabled } from "./Turnstile";

// Paleta rediseño v2
const DARK = "#3E2A1C";
const CREAM = "#F7F1E5";
const OLIVE = "#6E8B4E";

function money(n: number) {
  return `$${n.toLocaleString("es-CO")}`;
}

export default function FloatingCart() {
  const {
    lines, count, total, table, session, hasSession, sessionExpired,
    setQty, remove, setNotes, clear,
  } = useCart();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [tsToken, setTsToken] = useState<string>("");

  // Modo público (sin sesión de QR): el carrito funciona igual, pero el pedido
  // se envía como mensaje prefabricado de WhatsApp en vez de ir a la mesa.
  const publicMode = !hasSession;
  const [sedes, setSedes] = useState<SedeInfo[]>([]);
  const [pickSede, setPickSede] = useState(false);

  useEffect(() => {
    if (publicMode) {
      getSedes().then(list => setSedes(list.filter(s => s.whatsapp_phone))).catch(() => {});
    }
  }, [publicMode]);

  function waMessage(): string {
    const rows = lines.map(l => {
      let row = `• ${l.quantity}× ${l.name}`;
      if (l.sugar_level) {
        row += l.sugar_level === "Sin azúcar" ? " — sin azúcar" : ` — azúcar: ${l.sugar_level.toLowerCase()}`;
      }
      if (l.notes?.trim()) row += ` (nota: ${l.notes.trim()})`;
      return row;
    });
    return `¡Hola! Vengo de la carta de La Meca y quiero hacer este pedido:\n\n${rows.join("\n")}\n\nTotal estimado: ${money(total)}`;
  }

  function openWhatsApp(phone: string | null) {
    const fallback = process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "";
    const target = phone || fallback;
    const text = encodeURIComponent(waMessage());
    window.open(target ? `https://wa.me/${target}?text=${text}` : `https://wa.me/?text=${text}`, "_blank", "noopener");
    setPickSede(false);
    setDone("Abrimos WhatsApp con tu pedido listo — solo dale enviar.");
  }

  function sendWhatsApp() {
    if (sedes.length > 1) { setPickSede(true); return; }
    openWhatsApp(sedes[0]?.whatsapp_phone ?? null);
  }

  async function submit(type: "order" | "call") {
    setError("");

    if (!hasSession || !session) {
      setError("Tu sesión de mesa expiró. Vuelve a escanear el QR.");
      return;
    }
    if (turnstileEnabled() && !tsToken) {
      setError("Completa la verificación de seguridad.");
      return;
    }

    setSending(true);
    try {
      const res = await createOrder({
        session,
        type,
        items: type === "order" ? lines.map(l => ({ id: l.id, quantity: l.quantity, notes: l.notes, sugar_level: l.sugar_level })) : undefined,
        turnstileToken: tsToken || undefined,
      });
      setDone(res.message);
      if (type === "order") clear();
    } catch (e) {
      if (e instanceof SessionExpiredError) {
        setError("Tu sesión de mesa expiró. Vuelve a escanear el QR de tu mesa.");
      } else {
        setError((e as Error).message);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Botón flotante */}
      <AnimatePresence>
        {/* En modo público el botón solo aparece con productos (si no, se ve el de WhatsApp) */}
        {!open && (hasSession || count > 0) && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => { setOpen(true); setDone(null); setError(""); }}
            style={{
              position: "fixed", bottom: 22, right: 22, zIndex: 150,
              display: "flex", alignItems: "center", gap: 10,
              padding: count > 0 ? "14px 20px" : 16,
              borderRadius: 999, border: "none", cursor: "pointer",
              background: DARK, color: CREAM,
              boxShadow: "0 12px 36px rgba(10,6,4,0.45)",
              fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600,
            }}
            aria-label="Ver pedido"
          >
            <span style={{ fontSize: 20 }}>🛒</span>
            {count > 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                {count} {count === 1 ? "ítem" : "ítems"} · {money(total)}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,6,4,0.7)", backdropFilter: "blur(6px)" }}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 36 }}
              style={{
                position: "fixed", zIndex: 201, bottom: 0, left: 0, right: 0,
                maxWidth: 480, margin: "0 auto", maxHeight: "92dvh",
                background: CREAM, borderRadius: "24px 24px 0 0",
                display: "flex", flexDirection: "column",
                fontFamily: "var(--font-sans)", color: DARK,
                boxShadow: "0 -20px 60px rgba(10,6,4,0.5)",
              }}
            >
              {/* Header */}
              <div style={{ padding: "18px 22px 12px", borderBottom: "1px solid rgba(36,26,18,0.1)" }}>
                <span style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", width: 42, height: 5, borderRadius: 3, background: "rgba(36,26,18,0.2)" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 26, margin: 0 }}>Tu pedido</h2>
                  <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", fontSize: 26, cursor: "pointer", color: DARK, lineHeight: 1 }}>×</button>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.7 }}>
                  {publicMode ? "Se enviará por WhatsApp" : table ? table.label : "Mesa"}
                </p>
              </div>

              {/* Banner de sesión expirada */}
              {sessionExpired && (
                <div style={{ margin: "12px 22px 0", padding: "12px 14px", borderRadius: 12, background: "#FBEEE6", border: "1px solid #E7C8B3", color: "#8A4B2A", fontSize: 13, lineHeight: 1.5 }}>
                  ⏱ Tu sesión de mesa expiró. <strong>Vuelve a escanear el QR</strong> para pedir a tu mesa,
                  o envía tu pedido por <strong>WhatsApp</strong> aquí abajo.
                </div>
              )}

              {/* Body */}
              <div style={{ overflowY: "auto", flex: 1, padding: "12px 22px" }}>
                {done ? (
                  <div style={{ textAlign: "center", padding: "40px 12px" }}>
                    <div style={{ fontSize: 52, marginBottom: 12 }}>✓</div>
                    <p style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>{done}</p>
                    <button onClick={() => { setOpen(false); setDone(null); }}
                      style={{ marginTop: 24, padding: "12px 28px", borderRadius: 999, border: `1px solid ${DARK}`, background: "transparent", color: DARK, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                      Cerrar
                    </button>
                  </div>
                ) : lines.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 12px", opacity: 0.6 }}>
                    <div style={{ fontSize: 44, marginBottom: 10 }}>🛒</div>
                    <p style={{ fontSize: 14 }}>Tu carrito está vacío.</p>
                    {!publicMode && (
                      <>
                        <p style={{ fontSize: 13, marginTop: 18 }}>¿Solo necesitas atención?</p>
                        <button onClick={() => submit("call")} disabled={sending}
                          style={{ position: "relative", marginTop: 8, padding: "13px 26px", borderRadius: 999, border: "none", background: OLIVE, color: "#FBF7EC", cursor: "pointer", fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", boxShadow: "0 16px 34px -12px rgba(110,139,78,0.65)" }}>
                          <span aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: 999, border: "2px solid rgba(110,139,78,0.55)", animation: "pulseRing 2.2s ease-out infinite", pointerEvents: "none" }} />
                          🔔 Llamar al mesero
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {lines.map(l => (
                      <div key={l.key} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ width: 54, height: 54, borderRadius: 12, background: "#EFE4D2", flexShrink: 0, overflow: "hidden", backgroundImage: l.image_url ? `url('${l.image_url}')` : undefined, backgroundSize: "cover", backgroundPosition: "center" }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14.5 }}>{l.name}</div>
                          <div style={{ fontSize: 13, opacity: 0.7 }}>{money(l.price)}</div>
                          {l.sugar_level && (
                            <span style={{
                              display: "inline-block", marginTop: 4, fontSize: 11, fontWeight: 600,
                              padding: "2px 9px", borderRadius: 999,
                              background: "rgba(36,26,18,0.07)", color: "#6F4E37",
                            }}>
                              🍬 Azúcar: {l.sugar_level}
                            </span>
                          )}
                          <input
                            value={l.notes ?? ""}
                            onChange={e => setNotes(l.key, e.target.value)}
                            placeholder="Nota (ej. sin lactosa)"
                            style={{ marginTop: 6, width: "100%", fontSize: 12.5, padding: "6px 9px", borderRadius: 8, border: "1px solid rgba(62,42,28,0.18)", background: "#FFFCF5", color: DARK }}
                          />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button onClick={() => setQty(l.key, l.quantity - 1)} style={qtyBtn}>–</button>
                            <span style={{ minWidth: 18, textAlign: "center", fontWeight: 600 }}>{l.quantity}</span>
                            <button onClick={() => setQty(l.key, l.quantity + 1)} style={qtyBtn}>+</button>
                          </div>
                          <button onClick={() => remove(l.key)} style={{ background: "none", border: "none", color: "#B0392B", fontSize: 11.5, cursor: "pointer" }}>Quitar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer / checkout */}
              {!done && lines.length > 0 && (
                <div style={{ padding: "14px 22px 22px", borderTop: "1px solid rgba(36,26,18,0.1)" }}>
                  {publicMode ? (
                    pickSede ? (
                      // Selector de sede (más de una con WhatsApp)
                      <>
                        <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 10px" }}>¿A cuál sede envías tu pedido?</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {sedes.map(s => (
                            <button key={s.id} onClick={() => openWhatsApp(s.whatsapp_phone)}
                              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "13px 16px", borderRadius: 14, cursor: "pointer", border: "1px solid rgba(62,42,28,0.14)", background: "#FFFCF5", color: DARK, fontSize: 14, fontWeight: 600, textAlign: "left" }}>
                              <span>
                                {s.name}
                                {s.address && <span style={{ display: "block", fontSize: 12, fontWeight: 400, opacity: 0.6, marginTop: 2 }}>{s.address}</span>}
                              </span>
                              <span style={{ color: OLIVE, fontSize: 18 }}>›</span>
                            </button>
                          ))}
                        </div>
                        <button onClick={() => setPickSede(false)}
                          style={{ width: "100%", marginTop: 10, padding: "10px", borderRadius: 999, border: "none", background: "transparent", color: DARK, fontSize: 13, opacity: 0.6, cursor: "pointer" }}>
                          ‹ Volver al pedido
                        </button>
                      </>
                    ) : (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 16, fontWeight: 600 }}>
                          <span>Total estimado</span><span>{money(total)}</span>
                        </div>
                        <button onClick={sendWhatsApp}
                          style={{ width: "100%", padding: "15px", borderRadius: 999, border: "none", background: OLIVE, color: "#FBF7EC", fontSize: 14, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", boxShadow: "0 16px 34px -12px rgba(110,139,78,0.65)" }}>
                          Pedir por WhatsApp
                        </button>
                        <p style={{ margin: "10px 0 0", fontSize: 12, textAlign: "center", opacity: 0.55 }}>
                          Se abrirá WhatsApp con el mensaje de tu pedido listo para enviar.
                        </p>
                      </>
                    )
                  ) : (
                    <>
                      {turnstileEnabled() && (
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                          <Turnstile onToken={setTsToken} />
                        </div>
                      )}
                      {error && <p style={{ color: "#B0392B", fontSize: 13, margin: "0 0 10px", textAlign: "center" }}>{error}</p>}
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 16, fontWeight: 600 }}>
                        <span>Total</span><span>{money(total)}</span>
                      </div>
                      <button onClick={() => submit("order")} disabled={sending}
                        style={{ width: "100%", padding: "15px", borderRadius: 999, border: "none", background: DARK, color: CREAM, fontSize: 14, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>
                        {sending ? "Enviando…" : "Enviar pedido"}
                      </button>
                      <button onClick={() => submit("call")} disabled={sending}
                        style={{ width: "100%", marginTop: 10, padding: "12px", borderRadius: 999, border: `1px solid ${OLIVE}`, background: "transparent", color: OLIVE, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        🔔 Llamar al mesero
                      </button>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

const qtyBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(36,26,18,0.2)",
  background: "#FFFCF5", color: DARK, fontSize: 16, cursor: "pointer", lineHeight: 1,
  display: "flex", alignItems: "center", justifyContent: "center",
};
