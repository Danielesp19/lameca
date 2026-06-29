<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sedes', function (Blueprint $table) {
            $table->id();
            $table->string('name');                     // "La Meca Centro"
            $table->string('slug')->unique();           // "centro" — usado en URLs/Qator
            $table->string('whatsapp_phone')->nullable(); // E.164 sin +: "573001234567"
            $table->string('address')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // Sembramos 2 sedes para arrancar (el menú/precios son compartidos entre ambas).
        DB::table('sedes')->insert([
            [
                'name' => 'La Meca · Sede 1', 'slug' => 'sede-1',
                'whatsapp_phone' => null, 'address' => null,
                'is_active' => true, 'sort_order' => 1,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'name' => 'La Meca · Sede 2', 'slug' => 'sede-2',
                'whatsapp_phone' => null, 'address' => null,
                'is_active' => true, 'sort_order' => 2,
                'created_at' => now(), 'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('sedes');
    }
};
