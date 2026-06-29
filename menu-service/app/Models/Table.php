<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Table extends Model
{
    protected $fillable = [
        'sede_id',
        'number',
        'name',
        'qr_token',
        'token_rotated_at',
        'is_active',
    ];

    protected $casts = [
        'is_active'        => 'boolean',
        'token_rotated_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        // Capa 1: cada mesa nace con un token secreto no adivinable.
        static::creating(function (Table $table) {
            if (empty($table->qr_token)) {
                $table->qr_token = self::freshToken();
            }
        });
    }

    public static function freshToken(): string
    {
        return Str::random(32);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function sede()
    {
        return $this->belongsTo(Sede::class);
    }

    /** Etiqueta para mostrar en el panel / snapshot del pedido. */
    public function label(): string
    {
        return $this->name ? "Mesa {$this->number} · {$this->name}" : "Mesa {$this->number}";
    }
}
