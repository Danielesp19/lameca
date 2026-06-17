<?php

use App\Http\Controllers\MenuController;
use App\Http\Controllers\Admin\CategoryAdminController;
use App\Http\Controllers\Admin\ItemAdminController;
use Illuminate\Support\Facades\Route;

// Carta digital — pública
Route::prefix('menu')->group(function () {
    Route::get('/',                  [MenuController::class, 'index']);
    Route::get('/items/{menuItem}',  [MenuController::class, 'show']);
    Route::get('/hero',              [MenuController::class, 'hero']);
});

// Admin — protegido por token
Route::middleware('admin.token')->prefix('admin')->group(function () {
    Route::apiResource('categories', CategoryAdminController::class)->except(['show']);
    Route::apiResource('items',      ItemAdminController::class)->except(['show']);
});
