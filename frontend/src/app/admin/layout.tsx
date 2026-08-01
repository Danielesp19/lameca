"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { AdminSedeProvider } from "@/context/AdminSedeContext";
import SedeSwitcher from "@/components/admin/SedeSwitcher";

// "Productos" se unió a Categorías: cada categoría se expande ahí mismo
// para ordenar/crear/editar/borrar sus productos, así que no hace falta una
// sección aparte en la navegación.
//
// "Pedidos" y "Mesas" deshabilitados TEMPORALMENTE (a pedido del cliente,
// que por ahora solo quiere usar la carta digital, sin pedidos por mesa con
// QR propio) — se sacan de la navegación pero las páginas y sus datos
// siguen intactos, listos para reactivarse el día que hagan falta: basta
// con volver a agregarlos acá.
const NAV = [
  { href: "/admin/categories", label: "Categorías",  icon: "📂" },
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

  const pdfHref = `${process.env.NEXT_PUBLIC_MENU_API ?? "/api-menu"}/menu/pdf`;
  const logout  = () => { sessionStorage.removeItem("admin_token"); router.push("/admin/login"); };

  return (
    <AdminSedeProvider>
    <div style={{ minHeight: "100vh", background: "#F5F0EB", fontFamily: "var(--font-sans)" }}>
      {/* Barra superior — solo en móvil (<768px): la sidebar de escritorio no
          cabe en una pantalla angosta, así que se reemplaza por una franja
          horizontal fija arriba con lo mismo (marca, navegación, PDF, salir)
          en un formato compacto. Sticky: con una lista de categorías larga,
          que la navegación siga alcanzable sin volver a subir del todo. */}
      <div className="flex md:hidden items-center justify-between gap-2 sticky top-0 z-20 bg-white border-b border-[#E8E0D8] px-4 py-2.5">
        <img src="/logo.png" alt="La Meca" className="h-7 w-auto object-contain shrink-0" />
        <nav className="flex items-center gap-1 overflow-x-auto">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href} className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[13px]" style={{
                fontWeight: active ? 600 : 400,
                color:      active ? "#6F4E37" : "#6B5744",
                background: active ? "#F5EDE5"  : "transparent",
              }}>
                <span>{icon}</span>{label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1 shrink-0">
          <a href={pdfHref} download="carta-la-meca.pdf" title="Descargar carta (PDF)"
             className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E8E0D8] text-[#6B5744] text-[15px]">
            ⬇
          </a>
          <button onClick={logout} title="Cerrar sesión"
             className="flex h-8 w-8 items-center justify-center rounded-lg text-[#B0A090] text-[13px] bg-transparent border-none cursor-pointer">
            ⎋
          </button>
        </div>
      </div>

      {/* Sidebar — solo en escritorio (≥768px) */}
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-[220px] flex-col" style={{
        background: "#FFFFFF",
        borderRight: "1px solid #E8E0D8",
        padding: "24px 16px",
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
          href={pdfHref}
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
          onClick={logout}
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
      <main className="md:ml-[220px] px-4 py-6 md:px-12 md:py-10">
        {/* El selector de sede solo aplica a pedidos y mesas; productos y categorías son compartidos */}
        {(pathname.startsWith("/admin/orders") || pathname.startsWith("/admin/tables")) && <SedeSwitcher />}
        {children}
      </main>
    </div>
    </AdminSedeProvider>
  );
}
