<?php

namespace App\Support;

use Illuminate\Support\Facades\Http;

/**
 * Capa 3 — Cloudflare Turnstile (CAPTCHA invisible).
 *
 * Verifica el token que envía el navegador contra Cloudflare.
 * Si TURNSTILE_SECRET no está configurado, la verificación se omite
 * (modo dev) para no bloquear el desarrollo sin claves.
 */
class Turnstile
{
    public static function enabled(): bool
    {
        return (bool) config('coffee.turnstile_secret');
    }

    public static function verify(?string $token, ?string $ip = null): bool
    {
        if (! self::enabled()) {
            return true; // sin clave → no se exige (dev)
        }

        if (! $token) {
            return false;
        }

        try {
            $res = Http::asForm()
                ->timeout(5)
                ->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                    'secret'   => config('coffee.turnstile_secret'),
                    'response' => $token,
                    'remoteip' => $ip,
                ]);

            return (bool) ($res->json('success') ?? false);
        } catch (\Throwable $e) {
            // Ante un fallo de red con Cloudflare, no bloqueamos al cliente real.
            return true;
        }
    }
}
