import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";

// ── Anti fuerza bruta ────────────────────────────────────────────────────────
// Máx. 5 intentos fallidos por IP cada 15 minutos. En memoria: suficiente para
// un despliegue de proceso único (Hostinger); si algún día esto corre
// serverless multi-instancia, cambiar por un almacén compartido (Redis/BD).
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Comparación en tiempo constante (evita deducir la contraseña por timing).
// Se hashean ambos lados para igualar longitudes antes de comparar.
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const now = Date.now();

  const entry = attempts.get(ip);
  if (entry && entry.resetAt > now && entry.count >= MAX_ATTEMPTS) {
    const mins = Math.ceil((entry.resetAt - now) / 60000);
    return NextResponse.json(
      { error: `Demasiados intentos. Espera ${mins} min.` },
      { status: 429 },
    );
  }

  const { password } = await req.json().catch(() => ({ password: "" }));
  const expected = process.env.ADMIN_PASSWORD ?? "";

  const ok =
    typeof password === "string" &&
    password.length > 0 &&
    expected.length > 0 &&
    safeEqual(password, expected);

  if (!ok) {
    const e = entry && entry.resetAt > now ? entry : { count: 0, resetAt: now + WINDOW_MS };
    e.count += 1;
    attempts.set(ip, e);
    // Limpieza ocasional de entradas vencidas para no crecer sin límite.
    if (attempts.size > 500) {
      for (const [k, v] of attempts) if (v.resetAt <= now) attempts.delete(k);
    }
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  attempts.delete(ip);
  return NextResponse.json({ token: process.env.ADMIN_TOKEN ?? "" });
}
