<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Cek apakah user yang sedang login memiliki salah satu role yang diizinkan.
     *
     * Penggunaan di route:
     *   Route::middleware('role:developer')
     *   Route::middleware('role:user,waste_bank')       ← multi-role
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (! in_array($user->role, $roles, true)) {
            return response()->json([
                'message' => 'Forbidden. Anda tidak memiliki akses ke sumber daya ini.',
                'errors'  => ['role' => ["Diperlukan role: " . implode(' atau ', $roles)]],
            ], 403);
        }

        return $next($request);
    }
}
