<?php

namespace App\Console\Commands;

use App\Models\Table;
use Illuminate\Console\Command;

class RotateTableTokens extends Command
{
    protected $signature = 'tables:rotate-tokens';
    protected $description = 'Capa 5: rota el token QR de todas las mesas (invalida QRs viejos/fotografiados)';

    public function handle(): int
    {
        $tables = Table::all();

        foreach ($tables as $table) {
            $table->update([
                'qr_token'         => Table::freshToken(),
                'token_rotated_at' => now(),
            ]);
        }

        $this->warn("Tokens rotados: {$tables->count()}. Reimprime los QR de las mesas.");

        return self::SUCCESS;
    }
}
