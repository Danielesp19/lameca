<?php

namespace App\Console\Commands;

use App\Models\Order;
use Illuminate\Console\Command;

class ExpireOrders extends Command
{
    protected $signature = 'orders:expire';
    protected $description = 'Marca como expirados los pedidos pendientes que pasaron su expires_at';

    public function handle(): int
    {
        $count = Order::where('status', 'pending')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->update(['status' => 'expired']);

        $this->info("Pedidos expirados: {$count}");

        return self::SUCCESS;
    }
}
