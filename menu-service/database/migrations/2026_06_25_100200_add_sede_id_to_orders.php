<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('sede_id')->nullable()->after('table_id')
                ->constrained('sedes')->nullOnDelete();
            $table->index(['sede_id', 'status', 'created_at']);
        });

        // El historial existente se atribuye a la primera sede.
        $firstSede = DB::table('sedes')->orderBy('id')->value('id');
        if ($firstSede) {
            DB::table('orders')->whereNull('sede_id')->update(['sede_id' => $firstSede]);
        }
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['sede_id', 'status', 'created_at']);
            $table->dropConstrainedForeignId('sede_id');
        });
    }
};
