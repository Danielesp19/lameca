<?php

namespace App\Http\Controllers;

use App\Models\HeroSection;
use App\Models\MenuCategory;
use App\Models\MenuItem;

class MenuController extends Controller
{
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
                'items'       => $cat->availableItems->map(fn ($item) => $this->formatItem($item)),
            ]);

        return response()->json($menu);
    }

    public function show(MenuItem $menuItem)
    {
        $menuItem->load('category');

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
                'gif_url'     => $h->gif   ? asset('storage/' . $h->gif)   : null,
                'cta_label'   => $h->cta_label,
                'cta_url'     => $h->cta_url,
            ]);

        return response()->json($heroes);
    }

    private function formatItem(MenuItem $item, bool $detailed = false): array
    {
        $data = [
            'id'          => $item->id,
            'name'        => $item->name,
            'description' => $item->description,
            'price'       => (float) $item->price,
            'image_url'   => $item->image       ? asset('storage/' . $item->image) : null,
            'gif_url'     => $item->gif         ? asset('storage/' . $item->gif)   : null,
            'youtube_url' => $item->youtube_url ?? null,
            'is_featured' => $item->is_featured,
        ];

        if ($detailed) {
            $data['is_available'] = $item->is_available;
            $data['category']     = $item->category?->name;
        }

        return $data;
    }
}
