<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSubscriptionsTable extends Migration
{
    public function up()
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->text('preferences');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->foreignId('cart_id');
            $table->foreignId('method_of_payment_id');
            $table->boolean('is_active')->default(false);
            $table->timestamps();

            $table->foreign('cart_id')->references('id')->on('carts')->onDelete('cascade');
            $table->foreign('method_of_payment_id')->references('id')->on('payment_methods')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('subscriptions');
    }
}
