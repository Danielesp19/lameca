<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function index()
    {
        $carts = Cart::with('products')->get();

        return response()->json($carts, 200);
    }

    public function store(Request $request)
    {
        // Validar los datos de entrada
        $validatedData = $request->validate([
            'user_id' => 'required|exists:users,id',  // Verificar que el user_id exista
        ]);

        // Establecer el total en 0 al crear el carrito
        $validatedData['total'] = 0;

        // Crear el carrito utilizando los datos validados
        $cart = Cart::create($validatedData);

        return response()->json($cart, 201);
    }

    public function show(Cart $cart)
    {
        $cart->load('products');

        return response()->json($cart, 200);
    }

    public function update(Request $request, Cart $cart)
    {
        $validatedData = $request->validate([
            'total' => 'numeric|min:0',
        ]);

        $cart->update($validatedData);

        return response()->json($cart, 200);
    }

    public function destroy(Cart $cart)
    {
        $cart->delete();

        return response()->json(null, 204);
    }
}
