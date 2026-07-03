<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Poster del video generado con FFmpeg al subirlo (primer frame en JPEG).
// Nullable: si FFmpeg no está disponible el ítem funciona igual y el frontend
// cae a su miniatura por metadatos.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->string('video_poster')->nullable()->after('video');
        });
    }

    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropColumn('video_poster');
        });
    }
};
