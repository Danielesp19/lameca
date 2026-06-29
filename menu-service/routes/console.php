<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Auto-expira pedidos pendientes abandonados (mantiene limpia la cola del panel).
Schedule::command('orders:expire')->everyTenMinutes();

// Borra los pedidos del día a la medianoche exacta (hora Colombia).
// La información de cada pedido solo es útil en el momento, así que se limpia al cierre.
Schedule::command('orders:purge')->dailyAt('00:00')->timezone('America/Bogota');

// Capa 5: rotación de tokens. Descomenta para automatizarla (p.ej. cada noche).
// Schedule::command('tables:rotate-tokens')->dailyAt('05:00');
