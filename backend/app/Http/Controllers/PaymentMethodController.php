<?php

namespace App\Http\Controllers;

use App\Models\PaymentMethod;
use App\Models\User;
use Illuminate\Http\Request;

class PaymentMethodController extends Controller
{
    public function index(User $user)
    {

        $products = PaymentMethod::where('user_id', $user->id)->get();

        return response()->json($products, 200);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'nullable|string',
            'user_id' => 'required|exists:products,id',
        ]);

        $paymentMethod = PaymentMethod::create($validatedData);

        return response()->json($paymentMethod, 201);
    }

    public function show(PaymentMethod $paymentMethod)
    {
        return response()->json($paymentMethod, 200);
    }

    public function update(Request $request, PaymentMethod $paymentMethod)
    {
        $validatedData = $request->validate([
            'name' => 'string|max:255',
            'type' => 'nullable|string',
            'user_id' => 'required|exists:products,id',
        ]);

        $paymentMethod->update($validatedData);

        return response()->json($paymentMethod, 200);
    }

    public function destroy(PaymentMethod $paymentMethod)
    {
        $paymentMethod->delete();

        return response()->json(null, 204);
    }
}
