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

        // Minteo de sesiones de mesa (al escanear el QR).
        // La llave es la MESA, no la IP: en el local todos los comensales salen
        // por la misma IP pública del WiFi, y en datos móviles el operador usa
        // CGNAT. Limitando por IP, el cliente 11 del minuto recibía 429 y no
        // podía pedir. El techo por IP se mantiene, pero holgado: ya no estorba
        // al uso real y sigue frenando la inundación desde fuera.
        RateLimiter::for('table-sessions', function (Request $request) {
            $token = substr((string) $request->route('token'), 0, 64);

            return [
                Limit::perMinute(20)->by('mesa:' . $token),
                Limit::perMinute(200)->by('ip:' . $request->ip()),
            ];
        });

        // API admin: generoso para el uso real del panel (polling cada 8s +
        // navegación), pero frena martilleo/fuerza bruta del token Bearer.
        RateLimiter::for('admin-api', function (Request $request) {
            return Limit::perMinute(120)->by($request->ip());
        });
    }
}
