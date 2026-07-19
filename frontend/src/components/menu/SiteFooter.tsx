"use client";

import { useEffect, useState } from "react";
import { getSedes } from "@/lib/orders-api";
import type { SedeInfo } from "@/lib/table-session";

const CREAM = "#F7F1E5";
const DARK  = "#241710";

// ── Redes sociales del local ──────────────────────────────────────────────────
// TODO(cliente): reemplazar por los enlaces reales de La Meca.
const SOCIALS: { label: string; url: string; icon: "ig" | "fb" | "tt" }[] = [
  { label: "Instagram", url: "https://www.instagram.com/",  icon: "ig" },
  { label: "Facebook",  url: "https://www.facebook.com/",   icon: "fb" },
  { label: "TikTok",    url: "https://www.tiktok.com/",     icon: "tt" },
];

function SocialIcon({ icon }: { icon: "ig" | "fb" | "tt" }) {
  const paths = {
    ig: "M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16ZM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.7 21.31.27 16.95.07 15.67.01 15.26 0 12 0Zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84Zm0 10.15A3.99 3.99 0 1 1 16 12a3.99 3.99 0 0 1-4 3.99Zm6.41-11.85a1.44 1.44 0 1 0 1.43 1.44 1.44 1.44 0 0 0-1.43-1.44Z",
    fb: "M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.55-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07Z",
    tt: "M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07Z",
  } as const;
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={paths[icon]} />
    </svg>
  );
}

// Pie de página obligatorio: dirección física, contacto y redes sociales.
// Dirección y teléfonos salen de las sedes configuradas en el admin.
export default function SiteFooter() {
  const [sedes, setSedes] = useState<SedeInfo[]>([]);

  useEffect(() => {
    getSedes().then(setSedes).catch(() => {});
  }, []);

  return (
    <footer style={{
      background: DARK, color: CREAM,
      fontFamily: "var(--font-sans)",
      padding: "clamp(36px,5vw,56px) clamp(22px,5vw,68px) 26px",
    }}>
      <div style={{
        maxWidth: 920, margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "clamp(26px,4vw,44px)",
      }}>
        {/* Marca */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: "50%", background: "rgba(247,241,229,0.95)", flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="La Meca" style={{ width: 36, height: 36, objectFit: "contain" }} />
            </span>
            <span style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 19, letterSpacing: "0.24em" }}>LA MECA</span>
          </div>
          <p style={{ fontSize: 12.5, lineHeight: 1.6, opacity: 0.6, margin: 0, maxWidth: 240 }}>
            Café de origen, tostado en casa y servido con calma.
          </p>
        </div>

        {/* Visítanos: dirección física de cada sede */}
        <div>
          <h3 style={{ fontSize: 11, letterSpacing: "0.24em", textTransform: "uppercase", opacity: 0.55, margin: "0 0 14px" }}>Visítanos</h3>
          {sedes.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {sedes.map(s => (
                <div key={s.id} style={{ fontSize: 13, lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 600 }}>{s.name}</span>
                  {s.address && <span style={{ display: "block", opacity: 0.65 }}>{s.address}</span>}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, opacity: 0.65, margin: 0 }}>La Meca · Café de origen</p>
          )}
        </div>

        {/* Contacto: WhatsApp/teléfono de cada sede */}
        <div>
          <h3 style={{ fontSize: 11, letterSpacing: "0.24em", textTransform: "uppercase", opacity: 0.55, margin: "0 0 14px" }}>Contacto</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sedes.filter(s => s.whatsapp_phone).map(s => (
              <a
                key={s.id}
                href={`https://wa.me/${s.whatsapp_phone}`}
                target="_blank" rel="noopener noreferrer"
                style={{ color: CREAM, textDecoration: "none", fontSize: 13, opacity: 0.85 }}
              >
                {s.name}: +{s.whatsapp_phone}
              </a>
            ))}
            {sedes.every(s => !s.whatsapp_phone) && (
              <p style={{ fontSize: 13, opacity: 0.65, margin: 0 }}>Atención en el local</p>
            )}
            <a
              href={`${process.env.NEXT_PUBLIC_MENU_API ?? "/api-menu"}/menu/pdf`}
              download="carta-la-meca.pdf"
              style={{ color: CREAM, textDecoration: "underline", fontSize: 13, opacity: 0.85 }}
            >
              Descargar carta (PDF)
            </a>
          </div>
        </div>

        {/* Redes sociales */}
        <div>
          <h3 style={{ fontSize: 11, letterSpacing: "0.24em", textTransform: "uppercase", opacity: 0.55, margin: "0 0 14px" }}>Síguenos</h3>
          <div style={{ display: "flex", gap: 10 }}>
            {SOCIALS.map(s => (
              <a
                key={s.icon}
                href={s.url}
                target="_blank" rel="noopener noreferrer"
                aria-label={s.label}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 40, height: 40, borderRadius: "50%",
                  border: "1px solid rgba(247,241,229,0.3)", color: CREAM,
                  textDecoration: "none", transition: "all .25s",
                }}
                onMouseEnter={e => { const t = e.currentTarget; t.style.background = CREAM; t.style.color = DARK; }}
                onMouseLeave={e => { const t = e.currentTarget; t.style.background = "transparent"; t.style.color = CREAM; }}
              >
                <SocialIcon icon={s.icon} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: 920, margin: "clamp(28px,4vw,40px) auto 0",
        paddingTop: 18, borderTop: "1px solid rgba(247,241,229,0.14)",
        textAlign: "center", fontSize: 10.5, letterSpacing: "0.18em",
        textTransform: "uppercase", opacity: 0.45,
      }}>
        © {new Date().getFullYear()} La Meca · Todos los derechos reservados
      </div>
    </footer>
  );
}
