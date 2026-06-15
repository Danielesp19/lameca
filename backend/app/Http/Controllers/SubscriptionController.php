<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use Carbon\Carbon;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function index()
    {
        // Obtener todas las suscripciones con las relaciones necesarias
        $subscriptions = Subscription::with(['productCart', 'paymentMethod'])->get();

        return response()->json($subscriptions, 200);
    }

    public function store(Request $request)
    {
        try {
            // Validación de los datos de entrada
            $validatedData = $request->validate([
                'preferences' => 'required|string',
                'start_date' => 'required|date',
                'cart_id' => 'required',
                'method_of_payment_id' => 'required',
            ]);

            // Calcular end_date como un mes después de start_date
            $validatedData['end_date'] = Carbon::createFromFormat('Y-m-d', $validatedData['start_date'])->addMonth();
            $validatedData['is_active'] = false; // Establecer is_active en false por defecto

            // Crear una nueva suscripción
            $subscription = Subscription::create($validatedData);

            return response()->json($subscription, 201);
        } catch (\Exception $e) {
            // Manejar la excepción
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show(Subscription $subscription)
    {
        // Cargar las relaciones necesarias
        $subscription->load(['Cart', 'paymentMethod']);

        return response()->json($subscription, 200);
    }

    public function renove(Request $request, Subscription $subscription)
    {
        // Actualizar solo la fecha de inicio con la actual
        $currentDate = now();
        $subscription->update([
            'start_date' => $currentDate,
            'end_date' => Carbon::createFromFormat('Y-m-d', $currentDate)->addMonth(), // Actualizar end_date
            'is_active' => true,
        ]);

        return response()->json($subscription, 200);
    }

    public function destroy(Subscription $subscription)
    {
        // Eliminar la suscripción
        $subscription->delete();

        return response()->json(null, 204);
    }
}
