<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // El número de mesa deja de ser único globalmente: ahora la mesa "5"
        // puede existir en cada sede. Pasa a ser único por (sede_id, number).
        Schema::table('tables', function (Blueprint $table) {
            $table->dropUnique('tables_number_unique');
        });

        Schema::table('tables', function (Blueprint $table) {
            $table->foreignId('sede_id')->nullable()->after('id')
                ->constrained('sedes')->nullOnDelete();
        });

        // Las mesas existentes quedan asignadas a la primera sede.
        $firstSede = DB::table('sedes')->orderBy('id')->value('id');
        if ($firstSede) {
            DB::table('tables')->whereNull('sede_id')->update(['sede_id' => $firstSede]);
        }

        Schema::table('tables', function (Blueprint $table) {
            $table->unique(['sede_id', 'number']);
        });
    }

    public function down(): void
    {
        Schema::table('tables', function (Blueprint $table) {
            $table->dropUnique(['sede_id', 'number']);
            $table->dropConstrainedForeignId('sede_id');
            $table->unique('number');
        });
    }
};
