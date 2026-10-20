<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MemberCardController extends Controller
{
    /**
     * GET /api/user/member-card
     * Kembalikan data kartu member: name, avatar, member_code, points_balance.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'avatar' => $user->avatar ? asset('storage/'.$user->avatar) : null,
                'member_code' => $user->member_code,
                'points_balance' => $user->points_balance,
            ],
        ]);
    }

    /**
     * POST /api/user/member-token
     * Buat token QR sekali pakai (32 karakter, TTL 5 menit).
     * - Batalkan token lama milik user yang sama.
     * - Batasi 10 permintaan per menit per user.
     */
    public function generateToken(Request $request): JsonResponse
    {
        $user = $request->user();

        // ── Rate limiter: 10 req / menit ──────────────────────────────────
        $rateLimiterKey = 'member-token:'.$user->id;
        if (RateLimiter::tooManyAttempts($rateLimiterKey, 10)) {
            $seconds = RateLimiter::availableIn($rateLimiterKey);
            throw ValidationException::withMessages([
                'token' => ["Terlalu banyak permintaan. Coba lagi dalam {$seconds} detik."],
            ]);
        }
        RateLimiter::hit($rateLimiterKey, 60);

        $ttlSeconds = 5 * 60; // 5 menit
        $expiresAt = now()->addSeconds($ttlSeconds);

        // ── Batalkan token lama (jika ada) ────────────────────────────────
        $oldTokenKey = $this->userTokenPointerKey($user->id);
        $oldToken = Cache::get($oldTokenKey);

        if ($oldToken) {
            Cache::forget($this->tokenCacheKey($oldToken));
        }

        // ── Buat token baru ───────────────────────────────────────────────
        $token = Str::random(32);

        // Simpan: token → user_id
        Cache::put($this->tokenCacheKey($token), $user->id, $ttlSeconds);

        // Simpan: user_id → token (untuk pembatalan token lama)
        Cache::put($oldTokenKey, $token, $ttlSeconds);

        return response()->json([
            'data' => [
                'token' => $token,
                'expires_at' => $expiresAt->toIso8601String(),
            ],
        ]);
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    /** Key cache untuk token → user_id */
    public static function tokenCacheKey(string $token): string
    {
        return 'member_token:'.$token;
    }

    /** Key cache untuk user_id → token aktif */
    public static function userTokenPointerKey(int $userId): string
    {
        return 'member_token_user:'.$userId;
    }
}
