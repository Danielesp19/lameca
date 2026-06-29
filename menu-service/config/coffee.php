<?php

/*
|--------------------------------------------------------------------------
| Configuración de la app (CoffeeClub / La Meca)
|--------------------------------------------------------------------------
|
| IMPORTANTE: leer estos valores desde aquí con config('coffee.*') y NUNCA
| con env() dentro del código. En producción se corre `php artisan config:cache`
| y a partir de ahí env() devuelve null fuera de los archivos de config.
|
*/

return [

    // Token Bearer del panel admin. DEBE definirse en producción (largo y aleatorio).
    'admin_token' => env('ADMIN_TOKEN'),

    // Cloudflare Turnstile (CAPTCHA invisible, capa 3). Vacío = deshabilitado (dev).
    'turnstile_secret' => env('TURNSTILE_SECRET'),

    // Minutos de vida de una sesión de mesa firmada (QR → sesión corta).
    'table_session_ttl' => (int) env('TABLE_SESSION_TTL_MINUTES', 15),

    // Minutos hasta que un pedido pendiente se auto-expira.
    'order_ttl' => (int) env('ORDER_TTL_MINUTES', 45),

    // Orígenes permitidos para CORS, separados por coma. Ej:
    //   CORS_ALLOWED_ORIGINS=https://carta.lameca.co,https://admin.lameca.co
    // (en local, localhost se permite automáticamente).
    'cors_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('CORS_ALLOWED_ORIGINS', '')),
    ))),

];
