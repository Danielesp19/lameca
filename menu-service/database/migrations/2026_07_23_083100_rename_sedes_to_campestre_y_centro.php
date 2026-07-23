<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Renombra las dos sedes sembradas por defecto ("La Meca · Sede 1/2") a los
 * nombres reales del negocio. Se hace como migración (no como comando manual)
 * para que el cambio quede en el código y se aplique igual en cualquier
 * entorno (local, VPS) con un simple `php artisan migrate`.
 *
 * Empareja por slug (no por id): es estable sin importar el orden real de
 * inserción, y no toca sedes que el cliente ya haya renombrado a otra cosa.
 */
return new class extends Migration
{
    private const RENAMES = [
        'sede-1' => 'Meca Campestre',
        'sede-2' => 'Meca Centro',
    ];

    public function up(): void
    {
        foreach (self::RENAMES as $slug => $name) {
            DB::table('sedes')->where('slug', $slug)->update(['name' => $name]);
        }
    }

    public function down(): void
    {
        DB::table('sedes')->where('slug', 'sede-1')->update(['name' => 'La Meca · Sede 1']);
        DB::table('sedes')->where('slug', 'sede-2')->update(['name' => 'La Meca · Sede 2']);
    }
};
