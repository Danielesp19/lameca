<?php

namespace App\Support;

use App\Models\Table;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;

/**
 * Sesión de mesa firmada y de vida corta.
 *
 * El QR físico apunta a un token fijo y secreto de la mesa (qr_token). Ese token
 * NUNCA llega al navegador del cliente: al escanear, el backend emite con este
 * helper una "sesión" cifrada (AES + MAC vía Crypt) que caduca a los ~15 min.
 *
 * - El cliente solo guarda la sesión, no el token de la mesa.
 * - Cualquier link/sesión copiado o compartido muere al expirar.
 * - Para volver a pedir tras la expiración hay que re-escanear el QR (estás en la mesa).
 *
 * Es 100% stateless: no toca la base de datos para validar.
 */
class TableSession
{
    /** Minutos de vida de una sesión de mesa. */
    public static function ttlMinutes(): int
    {
        return max(1, (int) config('coffee.table_session_ttl', 15));
    }

    /** Emite una sesión cifrada para una mesa. */
    public static function issue(Table $table): string
    {
        $payload = [
            'tid' => $table->id,
            'sid' => $table->sede_id,
            'exp' => now()->addMinutes(self::ttlMinutes())->getTimestamp(),
        ];

        return Crypt::encryptString(json_encode($payload));
    }

    /**
     * Verifica una sesión. Devuelve el payload (tid, sid, exp) si es válida y
     * no ha expirado; null en cualquier otro caso (firma inválida o caducada).
     */
    public static function verify(?string $token): ?array
    {
        if (! $token) {
            return null;
        }

        try {
            $payload = json_decode(Crypt::decryptString($token), true);
        } catch (DecryptException) {
            return null; // firma inválida o manipulada
        }

        if (! is_array($payload) || empty($payload['tid']) || empty($payload['exp'])) {
            return null;
        }

        if ((int) $payload['exp'] < now()->getTimestamp()) {
            return null; // caducada → re-escanear
        }

        return $payload;
    }
}
