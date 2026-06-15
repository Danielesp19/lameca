<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureProducer
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Verificar si el usuario autenticado es una instancia de Producer.
        $user = $request->user();

        if ($user && $user instanceof \App\Models\Producer) {
            return $next($request);
        }

        // Si no es un Producer, retornar un error 403.
        return response()->json([
            'error' => 'Unauthorized',
            'message' => 'Access restricted to producers only.',
        ], 403);
    }
}
