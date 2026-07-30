<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class MenuCategory extends Model
{
    /** Presentación en la carta web. Ver la migración add_display_mode.
     *  "horizontal": vitrina de cierre con scroll de lado (p.ej. Métodos). */
    public const MODOS = ['grid', 'vertical', 'horizontal'];

    protected $fillable = ['name', 'slug', 'description', 'display_mode', 'sort_order', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $category) {
            if (empty($category->slug)) {
                $category->slug = Str::slug($category->name);
            }
        });
    }

    public function items()
    {
        return $this->hasMany(MenuItem::class)->orderBy('sort_order');
    }

    public function availableItems()
    {
        return $this->items()->where('is_available', true);
    }
}
