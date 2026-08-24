<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Nuevo WhatsApp de Meca Campestre. Centro conserva el suyo.
 *
 * Va como migración por lo mismo que las anteriores de sedes: no hay panel de
 * administración para sedes, así que el dato de negocio vive en el código y se
 * aplica igual en cualquier entorno con `php artisan migrate`.
 */
return new class extends Migration
{
    private const NUEVO = '573219681039';
    private const ANTES = '573123348548';

    public function up(): void
    {
        DB::table('sedes')->where('slug', 'campestre')
            ->update(['whatsapp_phone' => self::NUEVO]);
    }

    public function down(): void
    {
        DB::table('sedes')->where('slug', 'campestre')
            ->update(['whatsapp_phone' => self::ANTES]);
    }
};
