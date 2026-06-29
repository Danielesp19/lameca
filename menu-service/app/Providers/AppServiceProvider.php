<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Capa 2: rate limiting de pedidos.
        // Clave por sesión de mesa + IP → frena spam por inundación.
        RateLimiter::for('orders', function (Request $request) {
            $key = substr((string) ($request->input('session') ?? 'no-session'), 0, 32) . '|' . $request->ip();

            return [
                Limit::perMinute(2)->by($key),   // máx 2 por minuto por sesión+IP
                Limit::perHour(20)->by($key),    // máx 20 por hora
            ];
        });

        // Minteo de sesiones de mesa (al escanear el QR). Por IP: frena que
        // alguien desde fuera spamee el endpoint para generar sesiones en masa.
        RateLimiter::for('table-sessions', function (Request $request) {
            return [
                Limit::perMinute(10)->by($request->ip()),
                Limit::perHour(120)->by($request->ip()),
            ];
        });
    }
}
