<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Disponibilidad de productos POR SEDE.
 *
 * Cada sede maneja su propia carta y algunos productos están en ambas: un solo
 * catálogo compartido (una foto, una descripción, un precio por producto) y
 * esta tabla dice en qué sedes se ofrece cada uno. "Está en ambas" = dos
 * filas. Sin duplicar productos: duplicarlos obligaría a crear/fotografiar/
 * editar dos veces los compartidos, y los catálogos se desincronizan solos.
 *
 * Además renombra los slugs de las sedes (sede-1/sede-2 → campestre/centro):
 * van a viajar en la URL de los QR impresos de cada local
 * (menulameca.com/?sede=campestre) y "sede-1" ahí es ruido. Nada fuera de
 * migraciones ya corridas referencia los slugs viejos.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('sedes')->where('slug', 'sede-1')->update(['slug' => 'campestre']);
        DB::table('sedes')->where('slug', 'sede-2')->update(['slug' => 'centro']);

        Schema::create('menu_item_sede', function (Blueprint $table) {
            $table->foreignId('menu_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sede_id')->constrained()->cascadeOnDelete();
            $table->primary(['menu_item_id', 'sede_id']);
        });

        // Todos los productos existentes arrancan disponibles en TODAS las
        // sedes: el día del despliegue la carta se ve igual que antes, y el
        // admin va quitando marcas donde corresponda.
        $sedes = DB::table('sedes')->pluck('id');
        $items = DB::table('menu_items')->pluck('id');
        $rows  = [];
        foreach ($items as $itemId) {
            foreach ($sedes as $sedeId) {
                $rows[] = ['menu_item_id' => $itemId, 'sede_id' => $sedeId];
            }
        }
        if ($rows) {
            DB::table('menu_item_sede')->insert($rows);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_item_sede');
        DB::table('sedes')->where('slug', 'campestre')->update(['slug' => 'sede-1']);
        DB::table('sedes')->where('slug', 'centro')->update(['slug' => 'sede-2']);
    }
};
