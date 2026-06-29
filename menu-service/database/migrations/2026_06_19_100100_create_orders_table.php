<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('table_id')->nullable()->constrained('tables')->nullOnDelete();
            $table->string('table_label');                       // snapshot, sobrevive si se borra la mesa
            $table->string('type')->default('order');            // 'order' | 'call'
            $table->string('status')->default('pending');        // pending | seen | served | dismissed | expired
            $table->decimal('total', 10, 2)->default(0);
            $table->text('note')->nullable();
            $table->string('ip', 45)->nullable();                // Capa 4: rastreo de abuso
            $table->timestamp('expires_at')->nullable();         // auto-expiración de pendientes
            $table->timestamps();

            // Render rápido del panel: el listado filtra por status y ordena por fecha
            $table->index(['status', 'created_at']);
            $table->index(['table_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
