<?php

namespace App\Http\Controllers;

use App\Models\MenuCategory;
use App\Models\MenuItem;

class MenuController extends Controller
{
    /**
     * Carta completa agrupada por categoría, pública y sin autenticación.
     */
    public function index()
    {
        $menu = MenuCategory::where('is_active', true)
            ->with(['availableItems'])
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($cat) => [
                'id'          => $cat->id,
                'name'        => $cat->name,
                'slug'        => $cat->slug,
                'description' => $cat->description,
                'items'       => $cat->availableItems->map(fn ($item) => [
                    'id'           => $item->id,
                    'name'         => $item->name,
                    'description'  => $item->description,
                    'price'        => (float) $item->price,
                    'image_url'    => $item->image ? asset('storage/' . $item->image) : null,
                    'is_featured'  => $item->is_featured,
                ]),
            ]);

        return response()->json($menu);
    }

    /**
     * Detalle de un ítem.
     */
    public function show(MenuItem $menuItem)
    {
        return response()->json([
            'id'           => $menuItem->id,
            'name'         => $menuItem->name,
            'description'  => $menuItem->description,
            'price'        => (float) $menuItem->price,
            'image_url'    => $menuItem->image ? asset('storage/' . $menuItem->image) : null,
            'is_featured'  => $menuItem->is_featured,
            'is_available' => $menuItem->is_available,
            'category'     => $menuItem->category?->name,
        ]);
    }
}
