// ── Prefetch de videos del menú ──────────────────────────────────────────────
// Los videos se reproducen solos al hacer scroll. Si esperáramos a que la tarjeta
// llegue al centro para empezar a descargar, el usuario ve el spinner. En vez de eso
// "calentamos" la caché del navegador para los PRÓXIMOS videos mientras ve el actual,
// usando un <video> desconectado del DOM con preload="auto".
//
// El almacenamiento real lo hace la caché HTTP del navegador (configurada con
// Cache-Control largo en next.config para /menu-storage/*), que ya gestiona su propio
// desalojo LRU. Aquí solo mantenemos un pool pequeño de descargas "en vuelo": cuando
// se pasa del tope, se aborta la más vieja (sus bytes ya quedaron en la caché HTTP).

const MAX_WARM = 3; // cuántos videos mantenemos descargando/calientes a la vez

// Map mantiene el orden de inserción → lo usamos como LRU (el primero = más viejo).
const pool = new Map<string, HTMLVideoElement>();

export function prefetchVideo(url?: string | null): void {
  if (!url || typeof window === "undefined") return;

  // Ya está en el pool → refrescar su posición LRU (moverlo al final) y salir.
  if (pool.has(url)) {
    const existing = pool.get(url)!;
    pool.delete(url);
    pool.set(url, existing);
    return;
  }

  // Nuevo: crear un <video> fuera del DOM solo para que el navegador descargue y cachee.
  const v = document.createElement("video");
  v.muted = true;
  v.preload = "auto";
  v.src = url;
  v.load();
  pool.set(url, v);

  // Desalojar los más viejos: abortamos su descarga en curso (los bytes ya descargados
  // permanecen en la caché HTTP del navegador, así que un re-scroll sigue siendo rápido).
  while (pool.size > MAX_WARM) {
    const oldestKey = pool.keys().next().value as string;
    const old = pool.get(oldestKey)!;
    pool.delete(oldestKey);
    old.removeAttribute("src");
    old.load(); // corta la descarga pendiente
  }
}
