<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SummaryController extends Controller
{
    /**
     * GET /api/user/summary
     * Ringkasan akun user: saldo poin, total kg, jumlah setoran, setoran terakhir.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user()->fresh(); // pastikan data saldo terkini

        $aggregate = $user->deposits()
            ->selectRaw('COUNT(*) as deposit_count, COALESCE(SUM(total_weight_kg), 0) as total_kg')
            ->first();

        $lastDeposit = $user->deposits()
            ->with('wasteBank')
            ->latest()
            ->first();

        return response()->json([
            'data' => [
                'points_balance' => $user->points_balance,
                'total_kg' => (float) $aggregate->total_kg,
                'deposit_count' => (int) $aggregate->deposit_count,
                'last_deposit' => $lastDeposit ? [
                    'id' => $lastDeposit->id,
                    'waste_bank_name' => $lastDeposit->wasteBank->name,
                    'total_kg' => (float) $lastDeposit->total_weight_kg,
                    'total_points' => $lastDeposit->total_points,
                    'created_at' => $lastDeposit->created_at?->toIso8601String(),
                ] : null,
            ],
        ]);
    }
}
