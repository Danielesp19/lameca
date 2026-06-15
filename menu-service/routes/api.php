<?php

use App\Http\Controllers\MenuController;
use Illuminate\Support\Facades\Route;

// Carta digital — pública, sin autenticación
Route::prefix('menu')->group(function () {
    Route::get('/',              [MenuController::class, 'index']);
    Route::get('/items/{menuItem}', [MenuController::class, 'show']);
    Route::get('/hero',          [MenuController::class, 'hero']);
});
