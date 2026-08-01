<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Horario de atención de cada sede + dirección real de Campestre.
 *
 * Va como migración por la misma razón que las anteriores de sedes: no existe
 * panel de administración para sedes, así que el dato de negocio vive en el
 * código y se aplica igual en cualquier entorno con `php artisan migrate`.
 *
 * "Instalaciones Rumbambú" no era la dirección sino la referencia de dónde
 * queda: ahora va la dirección de verdad y la referencia aparte.
 */
return new class extends Migration
{
    private const DATOS = [
        // Meca Campestre
        'sede-1' => [
            'address'       => 'Carrera 2 #24-227',
            'address_note'  => 'Cerca de las instalaciones Rumbambú',
            'opening_hours' => 'Todos los días, 8:00 a.m. – 9:00 p.m.',
        ],
        // Meca Centro
        'sede-2' => [
            'address'       => 'Calle 4 #1B-48',
            'address_note'  => null,
            'opening_hours' => 'Lun a vie, 8:00 a.m. – 9:00 p.m. · Sáb, 8:00 a.m. – 10:00 p.m. · Dom, cerrado',
        ],
    ];

    public function up(): void
    {
        Schema::table('sedes', function (Blueprint $table) {
            $table->string('opening_hours')->nullable()->after('address');
            // Referencia de ubicación ("cerca de…"), aparte de la dirección:
            // mezclarlas en un solo campo obliga a partir el texto para
            // mostrarlas con distinto peso visual.
            $table->string('address_note')->nullable()->after('address');
        });

        foreach (self::DATOS as $slug => $datos) {
            DB::table('sedes')->where('slug', $slug)->update($datos);
        }
    }

    public function down(): void
    {
        // La dirección vuelve a lo que dejó la migración anterior.
        DB::table('sedes')->where('slug', 'sede-1')->update(['address' => 'Instalaciones Rumbambú']);

        Schema::table('sedes', function (Blueprint $table) {
            $table->dropColumn(['opening_hours', 'address_note']);
        });
    }
};
