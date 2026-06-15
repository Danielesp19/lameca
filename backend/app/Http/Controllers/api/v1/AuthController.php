<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Models\Producer;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // Validar que el usuario haya provisto los datos necesarios
        // para hacer la autenticación: "email" y "password".
        try {
            $request->validate([
                'email' => 'required|string|email|max:255',
                'password' => 'required|string|min:7',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'errors' => $e->errors(),
            ], 422);
        }

        // Verificar si el email pertenece a un User o a un Producer.
        $user = User::where('email', $request->email)->first();
        $producer = Producer::where('email', $request->email)->first();

        if ($user && Auth::guard('web')->attempt($request->only('email', 'password'))) {
            // Si es un User, autenticamos con el guard 'web'.
            return $this->generateTokenResponse($user, 'Bearer');
        } elseif ($producer && Auth::guard('producer')->attempt($request->only('email', 'password'))) {
            // Si es un Producer, autenticamos con el guard 'producer'.
            return $this->generateTokenResponse($producer, 'Bearer');
        }

        return response()->json([
            'message' => 'Invalid login details',
        ], 401);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Token revoked',
        ], 200);
    }

    /**
     * Genera la respuesta con el token para el usuario autenticado.
     *
     * @param  mixed  $user
     * @param  string  $tokenType
     * @return \Illuminate\Http\JsonResponse
     */
    private function generateTokenResponse($user, $tokenType)
    {
        // Borrar tokens anteriores del mismo tipo.
        $user->tokens()->where('name', $tokenType)->delete();

        // Crear un nuevo token.
        $token = $user->createToken($tokenType);

        return response()->json([
            'token' => $token->plainTextToken,
            'type' => $tokenType,
        ], 200);
    }
}
