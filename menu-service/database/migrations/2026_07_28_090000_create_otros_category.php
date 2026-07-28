<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Categoría "Otros": destino protegido para productos que se quedan sin
 * categoría (por ejemplo al borrar la categoría que los contenía). El
 * controlador (CategoryAdminController) bloquea su borrado y renombrado
 * comparando por slug === 'otros'.
 */
return new class extends Migration
{
    public function up(): void
    {
        $exists = DB::table('menu_categories')->where('slug', 'otros')->exists();
        if ($exists) return;

        $maxOrder = DB::table('menu_categories')->max('sort_order') ?? -1;

        DB::table('menu_categories')->insert([
            'name'        => 'Otros',
            'slug'        => 'otros',
            'description' => null,
            'sort_order'  => $maxOrder + 1,
            'is_active'   => true,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);
    }

    public function down(): void
    {
        $cat = DB::table('menu_categories')->where('slug', 'otros')->first();
        if ($cat && !DB::table('menu_items')->where('menu_category_id', $cat->id)->exists()) {
            DB::table('menu_categories')->where('id', $cat->id)->delete();
        }
    }
};
