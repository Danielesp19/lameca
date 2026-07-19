"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { AdminSedeProvider } from "@/context/AdminSedeContext";
import SedeSwitcher from "@/components/admin/SedeSwitcher";

const NAV = [
  { href: "/admin/orders",     label: "Pedidos",     icon: "🧾" },
  { href: "/admin/items",      label: "Productos",   icon: "🍽" },
  { href: "/admin/categories", label: "Categorías",  icon: "📂" },
  { href: "/admin/tables",     label: "Mesas",       icon: "🪑" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const isLogin  = pathname === "/admin/login";
  const [ready, setReady] = useState(isLogin);

  useEffect(() => {
    if (isLogin) { setReady(true); return; }
    if (!sessionStorage.getItem("admin_token")) { router.replace("/admin/login"); return; }
    setReady(true);
  }, [isLogin, router]);

  if (isLogin) return <>{children}</>;
  if (!ready)  return null;

  return (
    <AdminSedeProvider>
    <div style={{ display: "flex", minHeight: "100vh", background: "#F5F0EB", fontFamily: "var(--font-sans)" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: "#FFFFFF",
        borderRight: "1px solid #E8E0D8",
        display: "flex",
        flexDirection: "column",
        padding: "24px 16px",
        position: "fixed",
        top: 0, left: 0, bottom: 0,
      }}>
        {/* Brand */}
        <div style={{ marginBottom: 32, paddingLeft: 8 }}>
          <img src="/logo.png" alt="La Meca" style={{ height: 40, width: "auto", objectFit: "contain", marginBottom: 6 }} />
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9A7055" }}>
            Panel Admin
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV.map(({ href, label, icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href} style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                color:      active ? "#6F4E37" : "#6B5744",
                background: active ? "#F5EDE5"  : "transparent",
                textDecoration: "none",
                transition: "background 0.15s",
              }}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Descarga de la carta en PDF (misma que ven los clientes en el menú) */}
        <a
          href={`${process.env.NEXT_PUBLIC_MENU_API ?? "/api-menu"}/menu/pdf`}
          download="carta-la-meca.pdf"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 12px",
            marginBottom: 6,
            borderRadius: 8,
            fontSize: 13.5,
            color: "#6B5744",
            textDecoration: "none",
            border: "1px solid #E8E0D8",
          }}
        >
          <span style={{ fontSize: 15 }}>⬇</span>
          Descargar carta (PDF)
        </a>

        {/* Logout */}
        <button
          onClick={() => { sessionStorage.removeItem("admin_token"); router.push("/admin/login"); }}
          style={{
            textAlign: "left",
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 13,
            color: "#B0A090",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Cerrar sesión
        </button>
      </aside>

      {/* Content */}
      <main style={{ marginLeft: 220, flex: 1, padding: "40px 48px" }}>
        {/* El selector de sede solo aplica a pedidos y mesas; productos y categorías son compartidos */}
        {(pathname.startsWith("/admin/orders") || pathname.startsWith("/admin/tables")) && <SedeSwitcher />}
        {children}
      </main>
    </div>
    </AdminSedeProvider>
  );
}
