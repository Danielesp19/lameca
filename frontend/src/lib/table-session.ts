// Sesión de mesa de vida corta (modo QR).
//
// El QR físico apunta a /t/<token>. Al escanear, el backend emite una "sesión"
// cifrada y corta (~15 min) que el navegador guarda aquí. El token fijo de la
// mesa NUNCA llega al cliente: solo vive esta sesión, que caduca. Al expirar,
// el cliente debe re-escanear el QR para volver a pedir.

export interface SedeInfo {
  id: number;
  name: string;
  whatsapp_phone: string | null;
  address?: string | null;
}

export interface TableInfo {
  number: string;
  label: string;
}

export interface StoredSession {
  session: string;   // token de sesión cifrado (opaco para el cliente)
  exp: number;       // epoch en ms — cuándo caduca
  table: TableInfo;
  sede: SedeInfo | null;
}

const KEY = "lameca_session";

export function saveSession(s: StoredSession): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function readSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as StoredSession;
    if (!s?.session || !s?.exp) return null;
    return s;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
