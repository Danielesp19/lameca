<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens,HasFactory;

    protected $table = 'users';

    protected $fillable = ['name', 'email', 'password', 'coffee_points'];

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function recipes()
    {
        return $this->hasMany(Recipe::class);
    }

    public function paymentMethod()
    {
        return $this->hasMany(PaymentMethod::class);
    }

    public function getRouteKeyName()
    {
        return 'id';
    }
}
