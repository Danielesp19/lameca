<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    use HasFactory;

    protected $table = 'subscriptions';

    protected $fillable = [
        'preferences',
        'start_date',
        'end_date',
        'cart_id',
        'method_of_payment_id',
        'is_active',
    ];

    public function cart()
    {
        return $this->belongsTo(Cart::class);
    }

    public function paymentMethod()
    {
        return $this->belongsTo(PaymentMethod::class, 'method_of_payment_id');
    }
}
