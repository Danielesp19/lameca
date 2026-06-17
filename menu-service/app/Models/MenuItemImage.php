<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MenuItemImage extends Model
{
    protected $fillable = ['menu_item_id', 'path', 'sort_order'];

    public function item()
    {
        return $this->belongsTo(MenuItem::class, 'menu_item_id');
    }
}
