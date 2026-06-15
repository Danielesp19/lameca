<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Producer extends Authenticatable
{
    use HasApiTokens, HasFactory;

    protected $table = 'producers';

    protected $fillable = ['name', 'email', 'password', 'region', 'balance', 'bio'];

    protected $hidden = ['password', 'remember_token'];

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
