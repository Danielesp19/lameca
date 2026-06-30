<?php

namespace App\Http\Controllers;

use App\Models\HeroSection;
use App\Models\MenuCategory;
use App\Models\MenuItem;

class MenuController extends Controller
{
    public function index()
    {
        $categories = MenuCategory::where('is_active', true)
            ->with(['availableItems.extraImages'])
            ->orderBy('sort_order')
            ->get();

        $menu = $categories->map(fn ($cat) => [
            'id'          => $cat->id,
            'name'        => $cat->name,
            'slug'        => $cat->slug,
            'description' => $cat->description,
            'items'       => $cat->availableItems->map(fn ($item) => $this->formatItem($item))->values(),
        ])->values()->all();

        // ── Destacados (categoría sintética) ────────────────────────────────────
        // Reúne los productos marcados como destacados (la "promoción del día") y los
        // coloca PRIMERO en la carta. Siguen apareciendo también en su categoría real.
        $featured = $categories
            ->flatMap(fn ($cat) => $cat->availableItems)
            ->filter(fn ($item) => $item->is_featured)
            ->values();

        if ($featured->isNotEmpty()) {
            array_unshift($menu, [
                'id'          => -1, // id sintético; no choca con categorías reales
                'name'        => 'Destacados',
                'slug'        => 'destacados',
                'description' => 'La promoción del día',
                'items'       => $featured->map(fn ($item) => $this->formatItem($item))->values(),
            ]);
        }

        // Caché HTTP: el menú cambia poco. Permite que el CDN de Vercel (s-maxage)
        // y el navegador (max-age) sirvan la respuesta sin pegar al backend en cada
        // escaneo de QR. stale-while-revalidate evita esperas en la revalidación.
        return response()->json($menu)
            ->header('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=120');
    }

    public function show(MenuItem $menuItem)
    {
        $menuItem->load(['category', 'extraImages']);

        return response()->json($this->formatItem($menuItem, detailed: true));
    }

    public function hero()
    {
        $heroes = HeroSection::where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($h) => [
                'id'          => $h->id,
                'title'       => $h->title,
                'subtitle'    => $h->subtitle,
                'youtube_url' => $h->youtube_url,
                'image_url'   => $h->image ? asset('storage/' . $h->image) : null,
                'cta_label'   => $h->cta_label,
                'cta_url'     => $h->cta_url,
            ]);

        return response()->json($heroes)
            ->header('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=120');
    }

    private function formatItem(MenuItem $item, bool $detailed = false): array
    {
        $data = [
            'id'               => $item->id,
            'name'             => $item->name,
            'description'      => $item->description,
            'caffeine_level'   => $item->caffeine_level,
            'has_sugar_option' => (bool) $item->has_sugar_option,
            'price'            => (float) $item->price,
            'image_url'        => $item->image ? asset('storage/' . $item->image) : null,
            'video_url'        => $item->video ? asset('storage/' . $item->video) : null,
            'extra_image_urls' => ($item->relationLoaded('extraImages') ? $item->extraImages : $item->extraImages()->get())
                                    ->map(fn ($img) => asset('storage/' . $img->path))
                                    ->values()
                                    ->all(),
            'is_featured'      => $item->is_featured,
        ];

        if ($detailed) {
            $data['is_available'] = $item->is_available;
            $data['category']     = $item->category?->name;
        }

        return $data;
    }
}
