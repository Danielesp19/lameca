<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MenuItem extends Model
{
    protected $fillable = [
        'menu_category_id',
        'name',
        'description',
        'caffeine_level',
        'has_sugar_option',
        'price',
        'image',
        'video',
        'video_poster',
        'is_available',
        'is_featured',
        'sort_order',
    ];

    protected $casts = [
        'price'            => 'decimal:2',
        'caffeine_level'   => 'integer',
        'has_sugar_option' => 'boolean',
        'is_available'     => 'boolean',
        'is_featured'      => 'boolean',
        'sort_order'       => 'integer',
    ];

    public function category()
    {
        return $this->belongsTo(MenuCategory::class, 'menu_category_id');
    }

    public function extraImages()
    {
        return $this->hasMany(MenuItemImage::class)->orderBy('sort_order');
    }
}
