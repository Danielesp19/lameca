<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cart extends Model
{
    use HasFactory;

    protected $table = 'carts';

    protected $fillable = ['total', 'user_id'];

    public function products()
    {
        return $this->belongsToMany(Product::class, 'cart_product');
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }
}
