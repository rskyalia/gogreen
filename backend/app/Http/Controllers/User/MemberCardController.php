<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\MemberTokenStatusRequest;
use App\Http\Resources\MemberCardResource;
use App\Models\Deposit;
use App\Models\PointTransaction;
use App\Models\WasteBank;
use App\Services\QrTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * MemberCardController
 *
 * Mengelola kartu member digital user:
 *   GET  /api/user/member-card            → data kartu
 *   POST /api/user/member-token           → buat token QR baru
 *   GET  /api/user/member-token/status    → polling status token
 */
class MemberCardController extends Controller
{
    public function __construct(private readonly QrTokenService $qrTokenService) {}

    // ── GET /api/user/member-card ─────────────────────────────────────────

    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'data' => new MemberCardResource($request->user()),
        ]);
    }

    // ── POST /api/user/member-token ───────────────────────────────────────

    /**
     * Buat token QR baru (sekali pakai, TTL 5 menit).
     * Throttle dikonfigurasi di route (throttle:member-token → 10/menit).
     *
     * Jika user punya token berstatus claimed (sedang diproses bank sampah),
     * lempar token_in_process (409) agar user tahu proses masih berlangsung.
     */
    public function generateToken(Request $request): JsonResponse
    {
        $data = $this->qrTokenService->issue($request->user());

        return response()->json(['data' => $data]);
    }

    // ── GET /api/user/member-token/status?token= ─────────────────────────

    /**
     * Polling status token oleh user.
     *
     * Response:
     *   active  : { status, expires_at }
     *   claimed : { status, waste_bank_name, expires_at }
     *   used    : { status, deposit: { waste_bank_name, total_weight_kg, total_points, balance_after } }
     *   expired : { status }
     *
     * Token milik user lain → 404 (jangan bocorkan keberadaannya).
     */
    public function tokenStatus(MemberTokenStatusRequest $request): JsonResponse
    {
        $token = (string) $request->validated('token');
        $user = $request->user();
        $statusInfo = $this->qrTokenService->statusFor($token, $user);
        $status = $statusInfo['status'];

        $response = ['status' => $status];

        if ($status === 'claimed') {
            $bankId = $statusInfo['waste_bank_id'] ?? null;
            $response['waste_bank_name'] = $bankId
                ? WasteBank::find($bankId)?->name
                : null;
            $response['expires_at'] = $statusInfo['expires_at'] ?? null;
        }

        if ($status === 'active') {
            $response['expires_at'] = $statusInfo['expires_at'] ?? null;
        }

        if ($status === 'used') {
            $summary = $this->qrTokenService->getUsedSummary($token);

            if (! $summary || (int) ($summary['user_id'] ?? 0) !== (int) $user->id) {
                return $this->tokenNotFoundError();
            }

            // Coba baca deposit dari DB jika ada; jatuhkan ke ringkasan cache jika tidak.
            $depositId = $summary['deposit_id'] ?? null;
            $depositData = null;

            if ($depositId) {
                $deposit = Deposit::with('wasteBank')
                    ->where('user_id', $user->id)
                    ->find($depositId);

                if ($deposit) {
                    $pointTransaction = PointTransaction::where('user_id', $user->id)
                        ->where('reference_type', Deposit::class)
                        ->where('reference_id', $deposit->id)
                        ->latest()
                        ->first();

                    $depositData = [
                        'id' => $deposit->id,
                        'waste_bank_name' => $deposit->wasteBank->name,
                        'total_weight_kg' => (float) $deposit->total_weight_kg,
                        'total_points' => $deposit->total_points,
                        'balance_after' => $pointTransaction?->balance_after
                            ?? $user->fresh()->points_balance,
                    ];
                }
            }

            // Fallback ke ringkasan cache bila deposit belum bisa diakses via DB.
            if (! $depositData && isset($summary['waste_bank_name'])) {
                $depositData = [
                    'id' => $depositId,
                    'waste_bank_name' => $summary['waste_bank_name'],
                    'total_weight_kg' => (float) ($summary['total_weight_kg'] ?? 0),
                    'total_points' => (int) ($summary['total_points'] ?? 0),
                    'balance_after' => (int) ($summary['balance_after'] ?? 0),
                ];
            }

            if (! $depositData) {
                return $this->tokenNotFoundError();
            }

            $response['deposit'] = $depositData;
        }

        return response()->json(['data' => $response], 200, [], JSON_PRESERVE_ZERO_FRACTION);
    }

    private function tokenNotFoundError(): JsonResponse
    {
        return response()->json([
            'message' => 'Token QR tidak ditemukan.',
            'code' => 'token_invalid',
            'errors' => [],
        ], 404);
    }

    // ── Legacy static helpers (dipakai test lama) ─────────────────────────

    /** @deprecated Gunakan QrTokenService::tokenKey() */
    public static function tokenCacheKey(string $token): string
    {
        return QrTokenService::tokenKey($token);
    }

    /** @deprecated Gunakan QrTokenService::userKey() */
    public static function userTokenPointerKey(int $userId): string
    {
        return QrTokenService::userKey($userId);
    }
}
