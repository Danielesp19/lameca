<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class PurgeOrders extends Command
{
    // Zona horaria del negocio (la app corre en UTC). Cambia aquí si mueves de país.
    private const TIMEZONE = 'America/Bogota';

    protected $signature = 'orders:purge {--all : Borra TODOS los pedidos sin importar la fecha}';
    protected $description = 'Borra los pedidos de días anteriores. La info del pedido solo es útil en el momento; está pensado para correr cada noche.';

    public function handle(): int
    {
        $query = Order::query();

        if (! $this->option('all')) {
            // Solo lo de días anteriores: al correr pasada la medianoche, limpia el día que terminó
            // y NO toca pedidos hechos ya en el nuevo día (por si una sede cierra tarde).
            $query->where('created_at', '<', Carbon::today(self::TIMEZONE));
        }

        $ids = $query->pluck('id');

        if ($ids->isEmpty()) {
            $this->info('No hay pedidos para borrar.');
            return self::SUCCESS;
        }

        // Borramos primero los items y luego los pedidos (los items también caen por cascade,
        // pero lo hacemos explícito para no depender de las claves foráneas en SQLite).
        OrderItem::whereIn('order_id', $ids)->delete();
        $deleted = Order::whereIn('id', $ids)->delete();

        $this->info("Pedidos borrados: {$deleted}");

        return self::SUCCESS;
    }
}
