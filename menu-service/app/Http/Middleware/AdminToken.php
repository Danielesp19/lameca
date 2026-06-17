<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AdminToken
{
    public function handle(Request $request, Closure $next): mixed
    {
        $expected = env('ADMIN_TOKEN', '');
        if (!$expected || $request->bearerToken() !== $expected) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        return $next($request);
    }
}
