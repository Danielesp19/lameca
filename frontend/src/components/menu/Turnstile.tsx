"use client";

import { useEffect, useRef } from "react";

// Capa 3 — widget de Cloudflare Turnstile.
// Solo se activa si NEXT_PUBLIC_TURNSTILE_SITE_KEY está definido.
// Si no, no renderiza nada y el backend (sin secreto) no exige verificación.

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
    };
  }
}

export function turnstileEnabled(): boolean {
  return !!SITE_KEY;
}

export default function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!SITE_KEY || !ref.current) return;

    function render() {
      if (!window.turnstile || !ref.current || widgetId.current) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        size: "flexible",
        callback: (token: string) => onToken(token),
      });
    }

    if (window.turnstile) {
      render();
    } else {
      const existing = document.getElementById("cf-turnstile-script");
      if (!existing) {
        const s = document.createElement("script");
        s.id = "cf-turnstile-script";
        s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
        s.async = true;
        s.defer = true;
        s.onload = render;
        document.head.appendChild(s);
      } else {
        existing.addEventListener("load", render);
      }
    }

    return () => {
      if (widgetId.current && window.turnstile) {
        try { window.turnstile.remove(widgetId.current); } catch { /* ignore */ }
        widgetId.current = null;
      }
    };
  }, [onToken]);

  if (!SITE_KEY) return null;
  return <div ref={ref} style={{ margin: "4px 0" }} />;
}
