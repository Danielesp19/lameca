<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    public const STATUSES = ['pending', 'seen', 'served', 'billed', 'dismissed', 'expired'];

    protected $fillable = [
        'table_id',
        'sede_id',
        'table_label',
        'type',
        'status',
        'total',
        'note',
        'ip',
        'expires_at',
    ];

    protected $casts = [
        'total'      => 'decimal:2',
        'expires_at' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function table()
    {
        return $this->belongsTo(Table::class);
    }

    public function sede()
    {
        return $this->belongsTo(Sede::class);
    }

    /** Pedidos activos en cola (lo que el mesero debe atender). */
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['pending', 'seen']);
    }
}
