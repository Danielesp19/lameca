<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cómo se presenta una categoría en la carta web.
 *
 *   grid     → comportamiento de siempre (carrusel en "Todos", cuadrícula al filtrar)
 *   vertical → sección de cierre a lo ancho, fondo oscuro, sin scroll lateral;
 *              los productos van apareciendo al bajar
 *
 * Es un string y no un booleano `is_vertical` a propósito: si más adelante hace
 * falta un tercer modo, no toca migrar otra vez.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menu_categories', function (Blueprint $table) {
            $table->string('display_mode', 20)->default('grid')->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('menu_categories', function (Blueprint $table) {
            $table->dropColumn('display_mode');
        });
    }
};
