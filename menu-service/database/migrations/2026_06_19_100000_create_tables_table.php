<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tables', function (Blueprint $table) {
            $table->id();
            $table->string('number')->unique();          // "5", "Terraza-2"
            $table->string('name')->nullable();          // etiqueta amigable
            $table->string('qr_token', 64)->unique();    // Capa 1: secreto por mesa (no adivinable)
            $table->timestamp('token_rotated_at')->nullable(); // Capa 5
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tables');
    }
};
