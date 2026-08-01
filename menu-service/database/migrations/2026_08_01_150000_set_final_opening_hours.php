<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Horarios definitivos de las dos sedes.
 *
 * Fija el valor de AMBAS (no solo el que cambió) a propósito: las correcciones
 * llegaron en varias tandas y esta migración deja las dos en su valor final
 * sin depender de cuáles de las anteriores alcanzaron a correr en cada
 * entorno. Es idempotente: aplicarla dos veces da lo mismo.
 */
return new class extends Migration
{
    private const HORARIOS = [
        'sede-1' => 'Dom a vie, 8:00 a.m. – 10:00 p.m. · Sáb, 8:00 a.m. – 7:00 p.m.',  // Campestre
        'sede-2' => 'Lun a sáb, 8:00 a.m. – 9:00 p.m. · Dom, cerrado',                  // Centro
    ];

    public function up(): void
    {
        foreach (self::HORARIOS as $slug => $horario) {
            DB::table('sedes')->where('slug', $slug)->update(['opening_hours' => $horario]);
        }
    }

    public function down(): void
    {
        // Sin vuelta atrás útil: el valor anterior era simplemente incorrecto.
    }
};
