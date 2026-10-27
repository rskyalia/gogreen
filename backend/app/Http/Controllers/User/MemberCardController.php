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
     */
    public function generateToken(Request $request): JsonResponse
    {
        $data = $this->qrTokenService->generate($request->user()->id);

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
     * Hanya token milik user sendiri yang dapat dicek.
     */
    public function tokenStatus(MemberTokenStatusRequest $request): JsonResponse
    {
        $token = (string) $request->validated('token');
        $user = $request->user();
        $statusInfo = $this->qrTokenService->status($token);
        $status = $statusInfo['status'];

        // Token aktif/claimed masih punya payload → verifikasi kepemilikan.
        if (in_array($status, ['active', 'claimed'], true)) {
            $payload = $this->qrTokenService->get($token);

            if (! $payload || (int) $payload['user_id'] !== (int) $user->id) {
                return $this->tokenError();
            }
        }

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
            $depositId = $this->qrTokenService->getDepositId($token);

            if (! $depositId) {
                return $this->tokenError();
            }

            // Scope ke user yang login agar token milik orang lain tidak bocor.
            $deposit = Deposit::with('wasteBank')
                ->where('user_id', $user->id)
                ->find($depositId);

            if (! $deposit) {
                return $this->tokenError();
            }

            $pointTransaction = PointTransaction::where('user_id', $user->id)
                ->where('reference_type', Deposit::class)
                ->where('reference_id', $deposit->id)
                ->latest()
                ->first();

            $response['deposit'] = [
                'id' => $deposit->id,
                'waste_bank_name' => $deposit->wasteBank->name,
                'total_weight_kg' => (float) $deposit->total_weight_kg,
                'total_points' => $deposit->total_points,
                'balance_after' => $pointTransaction?->balance_after
                    ?? $user->fresh()->points_balance,
            ];
        }

        return response()->json(['data' => $response], 200, [], JSON_PRESERVE_ZERO_FRACTION);
    }

    private function tokenError(): JsonResponse
    {
        return response()->json([
            'message' => 'Token QR tidak ditemukan.',
            'code' => 'token_invalid',
            'errors' => [],
        ], 422);
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
