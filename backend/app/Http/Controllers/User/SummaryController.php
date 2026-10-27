<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SummaryController extends Controller
{
    /**
     * GET /api/user/summary
     *
     * Ringkasan lengkap akun user untuk halaman dashboard:
     *   - points_balance      : saldo poin terkini
     *   - total_kg            : total berat sampah yang pernah disetor
     *   - deposit_count       : jumlah setoran
     *   - waste_scan_count    : jumlah scan sampah
     *   - diy_submission_count: jumlah karya yang pernah diupload
     *   - last_deposit        : setoran terakhir (nullable)
     *   - recent_transactions : 5 transaksi poin terbaru untuk feed aktivitas
     */
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user()->fresh();

        // ── Aggregat setoran ──────────────────────────────────────────────
        $aggregate = $user->deposits()
            ->selectRaw('COUNT(*) as deposit_count, COALESCE(SUM(total_weight_kg), 0) as total_kg')
            ->first();

        // ── Setoran terakhir ──────────────────────────────────────────────
        $lastDeposit = $user->deposits()
            ->with('wasteBank')
            ->latest()
            ->first();

        // ── Jumlah scan sampah ────────────────────────────────────────────
        $wasteScanCount = $user->wasteScans()->count();

        // ── Jumlah karya diupload ─────────────────────────────────────────
        $diySubmissionCount = $user->diySubmissions()->count();

        // ── 5 transaksi poin terbaru ──────────────────────────────────────
        $recentTransactions = $user->pointTransactions()
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($tx) => [
                'id' => $tx->id,
                'type' => $tx->type,
                'points' => $tx->points,
                'description' => $tx->description,
                'created_at' => $tx->created_at?->toIso8601String(),
            ])
            ->all();

        return response()->json([
            'data' => [
                'points_balance' => $user->points_balance,
                'total_kg' => (float) $aggregate->total_kg,
                'deposit_count' => (int) $aggregate->deposit_count,
                'waste_scan_count' => $wasteScanCount,
                'diy_submission_count' => $diySubmissionCount,
                'last_deposit' => $lastDeposit ? [
                    'id' => $lastDeposit->id,
                    'waste_bank_name' => $lastDeposit->wasteBank->name,
                    'total_kg' => (float) $lastDeposit->total_weight_kg,
                    'total_points' => $lastDeposit->total_points,
                    'created_at' => $lastDeposit->created_at?->toIso8601String(),
                ] : null,
                'recent_transactions' => $recentTransactions,
            ],
        ]);
    }
}
