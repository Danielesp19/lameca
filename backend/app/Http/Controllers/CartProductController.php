<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\CartProduct;
use App\Models\Product;
use Illuminate\Http\Request;

class CartProductController extends Controller
{
    public function index($cart)
    {
        $cartProducts = CartProduct::with('product')
            ->where('cart_id', $cart)
            ->get();

        return response()->json($cartProducts, 200);
    }

    // Agregar un producto al carrito
    public function store(Request $request, $cartId, $productId)
    {
        $validatedData = $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $product = Product::findOrFail($productId);

        $totalToAdd = $product->price * $validatedData['quantity'];

        $cartProduct = CartProduct::create([
            'cart_id' => $cartId,
            'product_id' => $productId,
            'quantity' => $validatedData['quantity'],
        ]);

        $cart = Cart::findOrFail($cartId);
        $cart->total += $totalToAdd;
        $cart->save();

        return response()->json($cartProduct, 201);
    }

    public function destroy($cartId, $productId)
    {
        $cartProduct = CartProduct::where('cart_id', $cartId)
            ->where('product_id', $productId)
            ->first();

        if (! $cartProduct) {
            return response()->json(['message' => 'Product not found in the cart'], 404);
        }

        $product = Product::findOrFail($productId);

        $totalToSubtract = $product->price * $cartProduct->quantity;

        $cartProduct->delete();

        $cart = Cart::findOrFail($cartId);
        $cart->total -= $totalToSubtract;
        $cart->save();

        return response()->json(null, 204);
    }

    public function show(CartProduct $cartProduct)
    {
        $cartProduct->load(['cart', 'product']);

        return response()->json($cartProduct, 200);
    }

    public function update(Request $request, CartProduct $cartProduct)
    {
        $validatedData = $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $cartProduct->update($validatedData);

        return response()->json($cartProduct, 200);
    }
}
