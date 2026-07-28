<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Números reales de WhatsApp de cada sede (en producción el campo estaba en
 * null — no hay panel admin para sedes todavía). Migración por la misma
 * razón que el renombrado y las direcciones: que el cambio quede en el
 * código y se aplique igual en cualquier entorno con `php artisan migrate`.
 */
return new class extends Migration
{
    private const NEW_PHONES = [
        'sede-1' => '573123348548', // Meca Campestre
        'sede-2' => '573214813850', // Meca Centro
    ];

    public function up(): void
    {
        foreach (self::NEW_PHONES as $slug => $phone) {
            DB::table('sedes')->where('slug', $slug)->update(['whatsapp_phone' => $phone]);
        }
    }

    public function down(): void
    {
        DB::table('sedes')->whereIn('slug', array_keys(self::NEW_PHONES))->update(['whatsapp_phone' => null]);
    }
};
