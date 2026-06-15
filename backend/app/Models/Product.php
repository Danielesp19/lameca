<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $table = 'products';

    protected $fillable = ['name', 'description', 'flavor', 'preparation_method', 'price', 'region', 'quantity', 'producer_id'];

    public function producer()
    {
        return $this->belongsTo(Producer::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function recipes()
    {
        return $this->hasMany(Recipe::class);
    }
}
