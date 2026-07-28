<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Direcciones reales de las dos sedes (dato de negocio, no editable desde el
 * admin todavía — no existe panel para sedes). Se hace como migración por la
 * misma razón que el renombrado: que el cambio quede en el código y se
 * aplique igual en cualquier entorno con `php artisan migrate`.
 */
return new class extends Migration
{
    private const ADDRESSES = [
        'sede-1' => 'Instalaciones Rumbambú',   // Meca Campestre
        'sede-2' => 'Calle 4 #1B-48',            // Meca Centro
    ];

    public function up(): void
    {
        foreach (self::ADDRESSES as $slug => $address) {
            DB::table('sedes')->where('slug', $slug)->update(['address' => $address]);
        }
    }

    public function down(): void
    {
        DB::table('sedes')->whereIn('slug', array_keys(self::ADDRESSES))->update(['address' => null]);
    }
};
