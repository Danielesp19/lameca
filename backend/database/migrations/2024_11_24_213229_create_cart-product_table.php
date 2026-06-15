<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCartProductTable extends Migration
{
    public function up(): void
    {
        Schema::create('product_cart', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id');
            $table->foreignId('cart_id');
            $table->timestamps();
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->foreign('cart_id')->references('id')->on('carts')->onDelete('cascade');

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_cart');
    }
}
