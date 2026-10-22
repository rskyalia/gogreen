<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PointTransaction;
use App\Models\RewardRedemption;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class RedemptionController extends Controller
{
    /**
     * GET /api/admin/redemptions?status=pending|completed|cancelled
     */
    public function index(Request $request): JsonResponse
    {
        $redemptions = RewardRedemption::with(['user', 'reward'])
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => $redemptions->items(),
            'meta' => [
                'current_page' => $redemptions->currentPage(),
                'last_page' => $redemptions->lastPage(),
                'total' => $redemptions->total(),
                'per_page' => $redemptions->perPage(),
            ],
        ]);
    }

    /**
     * PATCH /api/admin/redemptions/{id}
     *
     * Transisi yang diizinkan:
     *   pending → completed
     *   pending → cancelled
     *
     * Saat cancelled: kembalikan poin via point_transactions type=adjustment,
     * dan kembalikan stok, semua dalam satu DB::transaction.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['completed', 'cancelled'])],
        ]);

        $redemption = RewardRedemption::with(['user', 'reward'])->findOrFail($id);

        if ($redemption->status !== 'pending') {
            throw ValidationException::withMessages([
                'status' => ['Hanya penukaran berstatus pending yang dapat diproses.'],
            ]);
        }

        if ($validated['status'] === 'cancelled') {
            DB::transaction(function () use ($redemption) {
                $user = $redemption->user;
                $reward = $redemption->reward;
                $points = $redemption->points_spent;

                // Kembalikan poin ke user
                $newBalance = $user->points_balance + $points;
                $user->update(['points_balance' => $newBalance]);

                // Catat di ledger sebagai adjustment
                PointTransaction::create([
                    'user_id' => $user->id,
                    'type' => 'adjustment',
                    'points' => $points,
                    'balance_after' => $newBalance,
                    'reference_type' => RewardRedemption::class,
                    'reference_id' => $redemption->id,
                    'description' => "Pembatalan penukaran reward: {$reward->name}",
                ]);

                // Kembalikan stok jika terbatas
                if ($reward->stock !== null) {
                    $reward->increment('stock');
                }

                $redemption->update(['status' => 'cancelled']);
            });
        } else {
            $redemption->update(['status' => 'completed']);
        }

        return response()->json([
            'message' => $validated['status'] === 'cancelled'
                ? 'Penukaran dibatalkan dan poin dikembalikan.'
                : 'Penukaran ditandai selesai.',
            'data' => $redemption->fresh(['user', 'reward']),
        ]);
    }
}
