<?php

use App\Http\Controllers\CartController;
use App\Http\Controllers\CartProductController;
use App\Http\Controllers\PaymentMethodController;
use App\Http\Controllers\ProducerController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\RecipeController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\UserController;
use App\Http\Middleware\EnsureProducer;
use App\Http\Middleware\EnsureUser;
use Illuminate\Support\Facades\Route;

Route::post('/users', [UserController::class, 'store']);
Route::post('/producers', [ProducerController::class, 'store']);

Route::prefix('products')->group(function () {
    Route::get('/', [ProductController::class, 'index']); // Listar productos
    Route::get('/{product}', [ProductController::class, 'show']); // Detalle de producto
});

Route::get('/recipes', [RecipeController::class, 'index']);

Route::post('/login', [App\Http\Controllers\Api\V1\AuthController::class, 'login'])->name('api.login');

Route::middleware(['auth:sanctum', EnsureUser::class])->group(function () {
    // Suscripciones: suscribirse a una caja mensual
    Route::prefix('subscriptions')->group(function () {
        Route::post('/', [SubscriptionController::class, 'store']);
        Route::delete('/{subscription}', [SubscriptionController::class, 'destroy']);
        Route::get('/{subscription}', [SubscriptionController::class, 'show']);
        Route::put('/{subscription}', [SubscriptionController::class, 'renove']);
    });

    // Reseñas: dejar una reseña de un producto
    Route::prefix('reviews')->group(function () {
        Route::post('/', [ReviewController::class, 'store']);
        Route::put('/{review}', [ReviewController::class, 'update']);
        Route::delete('/{review}', [ReviewController::class, 'destroy']);
    });
    Route::get('/user/{user}/reviews', [ReviewController::class, 'myReview']); //todas las reviews d eun cliente
    Route::get('/product/{product}/reviews', [ReviewController::class, 'reviewProduct']); //todas las reviews d eun cliente

    Route::post('/recipes', [RecipeController::class, 'store']);
    Route::delete('/recipes/{recipe}', [RecipeController::class, 'destroy']);

    // Usuarios: actualizar información propia
    Route::put('/users/{user}', [UserController::class, 'update']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);
    // Carrito: agregar productos al carrito
    Route::prefix('carts')->group(function () {
        Route::post('/', [CartController::class, 'store']); //crear un carrito
        Route::delete('/{cart}', [CartController::class, 'destroy']); //descarta el carrito
        Route::post('/{cart}/products/{product}', [CartProductController::class, 'store']); //añade los productos d eun carrito
        Route::delete('/{cart}/products/{product}', [CartProductController::class, 'destroy']); //eliminar el producto de un carrito
        Route::get('/{cart}/products/', [CartProductController::class, 'index']); //mostrar todos los productos d eun carrito
    });
    // Método de pago: agregar métodos de pago
    Route::prefix('payments-methods')->group(function () {
        Route::post('/', [PaymentMethodController::class, 'store']);
        Route::put('/{paymentMethod}', [PaymentMethodController::class, 'update']);
        Route::delete('/{paymentMethod}', [PaymentMethodController::class, 'destroy']);
    });
    Route::get('users/{user}/payments-methods', [PaymentMethodController::class, 'index']);
    Route::middleware(['auth:sanctum'])->post('/logout', [App\Http\Controllers\Api\V1\AuthController::class, 'logout'])->name('api.logout');
});

// Rutas protegidas para productores i  IMPORTANTE TIENEN PRODUCERS EN LAS RUTAS
Route::middleware(['auth:sanctum', EnsureProducer::class])->prefix('producers')->group(function () {
    // Productos: eliminar un producto
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{product}', [ProductController::class, 'update']);
    Route::delete('/products/{product}', [ProductController::class, 'destroy']);
    Route::get('/{producer}/products', [ProductController::class, 'getMyProducts']);

    Route::delete('/{producer}', [UserController::class, 'destroy']);
    Route::put('/{producer}', [UserController::class, 'update']);

    Route::middleware(['auth:sanctum'])->post('/logout', [App\Http\Controllers\Api\V1\AuthController::class, 'logout'])->name('api.logout');
});
