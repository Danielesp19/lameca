<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Corrige el horario de Meca Campestre: no es igual todos los días como se
 * había cargado — el sábado cierra bastante antes.
 *
 * Va como migración aparte y no editando la anterior: esa ya está desplegada
 * y una migración que ya corrió no se vuelve a ejecutar, así que el cambio
 * nunca llegaría al servidor.
 */
return new class extends Migration
{
    private const ANTES  = 'Todos los días, 8:00 a.m. – 9:00 p.m.';
    private const AHORA  = 'Dom a vie, 8:00 a.m. – 10:00 p.m. · Sáb, 8:00 a.m. – 7:00 p.m.';

    public function up(): void
    {
        DB::table('sedes')->where('slug', 'sede-1')->update(['opening_hours' => self::AHORA]);
    }

    public function down(): void
    {
        DB::table('sedes')->where('slug', 'sede-1')->update(['opening_hours' => self::ANTES]);
    }
};
