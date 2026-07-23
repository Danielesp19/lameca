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

    // Máximo de pedidos activos (pending/seen) por mesa. Frena la inundación
    // de una mesa aunque alguien tenga la URL del QR. 0 = sin límite.
    'max_active_orders' => (int) env('MAX_ACTIVE_ORDERS_PER_TABLE', 3),

    // Horario de atención "HH:MM-HH:MM" en hora local del negocio.
    // Fuera de este rango no se aceptan pedidos ni llamadas al mesero.
    // Vacío = siempre abierto. Soporta cruzar medianoche: "18:00-02:00".
    'service_hours' => trim((string) env('SERVICE_HOURS', '')),

    // Zona horaria del negocio (para el horario de atención).
    'timezone' => env('COFFEE_TIMEZONE', 'America/Bogota'),

    // Imágenes subidas: lado máximo en píxeles y calidad WebP (30-100).
    // Toda imagen se reduce a este límite y se re-encodea al subirla.
    // (87 en vez de 80: el salto de peso es moderado y se nota más nítido en
    // degradados/texturas finas — café con espuma, glaseados, etc.)
    'max_image_px'  => (int) env('MAX_IMAGE_PX', 1800),
    'image_quality' => (int) env('IMAGE_QUALITY', 87),

    // Videos subidos: se recomprimen con FFmpeg (H.264, sin audio) al subirlos.
    // CRF más alto = más compresión (30 deja un clip de ~10s en ~1-3 MB).
    'ffmpeg'       => env('FFMPEG_PATH', 'ffmpeg'),
    'max_video_px' => (int) env('MAX_VIDEO_PX', 720),
    'video_crf'    => (int) env('VIDEO_CRF', 30),

    // Orígenes permitidos para CORS, separados por coma. Ej:
    //   CORS_ALLOWED_ORIGINS=https://carta.lameca.co,https://admin.lameca.co
    // (en local, localhost se permite automáticamente).
    'cors_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('CORS_ALLOWED_ORIGINS', '')),
    ))),

];
