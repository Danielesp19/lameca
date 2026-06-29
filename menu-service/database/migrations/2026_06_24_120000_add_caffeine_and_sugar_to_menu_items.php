<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            // Nivel de cafeína: null = no aplica/no definido, 0 = sin cafeína … 3 = alta.
            $table->unsignedTinyInteger('caffeine_level')->nullable()->after('description');
            // Si el cliente puede elegir el nivel de azúcar al pedir este producto.
            $table->boolean('has_sugar_option')->default(true)->after('caffeine_level');
        });
    }

    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropColumn(['caffeine_level', 'has_sugar_option']);
        });
    }
};
