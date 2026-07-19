<?php

namespace App\Support;

use Illuminate\Support\Carbon;

/**
 * Horario de atención para recibir pedidos por QR.
 *
 * Se configura con SERVICE_HOURS en formato "HH:MM-HH:MM" (hora local del
 * negocio, config coffee.timezone). Vacío = siempre abierto. Soporta rangos
 * que cruzan medianoche, p. ej. "18:00-02:00".
 */
class ServiceHours
{
    public static function isOpen(?Carbon $at = null): bool
    {
        $range = (string) config('coffee.service_hours', '');
        if ($range === '') {
            return true;
        }

        // Config malformada: no bloquear la operación por un typo en el .env.
        if (! preg_match('/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/', $range, $m)) {
            return true;
        }

        $tz  = (string) config('coffee.timezone', 'America/Bogota');
        $now = ($at ?? Carbon::now())->copy()->setTimezone($tz);

        $minutes = $now->hour * 60 + $now->minute;
        $start   = ((int) $m[1]) * 60 + (int) $m[2];
        $end     = ((int) $m[3]) * 60 + (int) $m[4];

        if ($start === $end) {
            return true; // rango vacío = 24 horas
        }

        return $start < $end
            ? ($minutes >= $start && $minutes < $end)
            : ($minutes >= $start || $minutes < $end); // cruza medianoche
    }
}
