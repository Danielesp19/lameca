<?php

use App\Http\Controllers\MenuController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\Admin\CategoryAdminController;
use App\Http\Controllers\Admin\ItemAdminController;
use App\Http\Controllers\Admin\OrderAdminController;
use App\Http\Controllers\Admin\SedeAdminController;
use App\Http\Controllers\Admin\TableAdminController;
use Illuminate\Support\Facades\Route;

// Carta digital — pública
Route::prefix('menu')->group(function () {
    Route::get('/',                  [MenuController::class, 'index']);
    Route::get('/pdf',               \App\Http\Controllers\MenuPdfController::class);
    Route::get('/items/{menuItem}',  [MenuController::class, 'show']);
    Route::get('/hero',              [MenuController::class, 'hero']);
});

// Sedes — público (para el botón de WhatsApp del menú público)
Route::get('/sedes', [OrderController::class, 'sedes']);

// Pedidos — públicos (con rate limit, capa 2)
Route::get('/tables/{token}/session', [OrderController::class, 'mintSession']) // capa 1+5: QR → sesión corta
    ->middleware('throttle:table-sessions');
Route::post('/orders', [OrderController::class, 'store'])->middleware('throttle:orders');

// Admin — protegido por token + rate limit por IP
Route::middleware(['throttle:admin-api', 'admin.token'])->prefix('admin')->group(function () {
    Route::post('categories/reorder', [CategoryAdminController::class, 'reorder']);
    Route::apiResource('categories', CategoryAdminController::class)->except(['show']);
    Route::apiResource('items',      ItemAdminController::class)->except(['show']);

    // Sedes
    Route::apiResource('sedes', SedeAdminController::class)->except(['show']);

    // Pedidos
    Route::get('orders',                 [OrderAdminController::class, 'index']);
    Route::get('orders/pending-count',   [OrderAdminController::class, 'pendingCount']);
    Route::patch('orders/{order}/status',[OrderAdminController::class, 'updateStatus']);

    // Mesas
    Route::apiResource('tables', TableAdminController::class)->except(['show']);
    Route::post('tables/{table}/rotate-token', [TableAdminController::class, 'rotateToken']);
});

// Preflight OPTIONS para CORS (sin autenticación)
Route::options('{any}', fn() => response('', 204))->where('any', '.*');
