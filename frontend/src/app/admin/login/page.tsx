"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const router = useRouter();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin-auth", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ password }),
      });
      if (!res.ok) { setError("Contraseña incorrecta"); return; }
      const { token } = await res.json();
      sessionStorage.setItem("admin_token", token);
      router.replace("/admin/items");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#F5F0EB",
      fontFamily: "var(--font-sans)",
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo area */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/logo.png" alt="La Meca" style={{ height: 64, width: "auto", objectFit: "contain", marginBottom: 12 }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1C0F05", fontFamily: "var(--font-serif)", margin: 0 }}>
            Panel admin
          </h1>
        </div>

        {/* Card */}
        <form onSubmit={submit} style={{
          background: "#FFFFFF",
          borderRadius: 16,
          padding: "32px 28px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
        }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B5744", marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoFocus
            required
            style={{
              width: "100%",
              padding: "11px 14px",
              borderRadius: 10,
              border: "1.5px solid #E8E0D8",
              fontSize: 14,
              color: "#1C0F05",
              outline: "none",
              boxSizing: "border-box",
              marginBottom: 8,
            }}
          />

          {error && (
            <p style={{ fontSize: 13, color: "#DC2626", marginBottom: 12, marginTop: 4 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "11px",
              borderRadius: 10,
              border: "none",
              background: loading ? "#C8A97E" : "#6F4E37",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 8,
              transition: "background 0.2s",
            }}
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
