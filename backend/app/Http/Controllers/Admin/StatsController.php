<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Deposit;
use App\Models\DiySubmission;
use App\Models\MlApiLog;
use App\Models\User;
use App\Models\WasteBank;
use App\Models\WasteScan;
use Illuminate\Http\JsonResponse;

class StatsController extends Controller
{
    /**
     * GET /api/admin/stats
     *
     * Mengembalikan:
     * - total user per role
     * - total scan
     * - total setoran
     * - jumlah diy_submissions pending
     * - jumlah waste_banks pending
     * - ringkasan status API ML 24 jam terakhir
     */
    public function index(): JsonResponse
    {
        // ── Users per role ────────────────────────────────────────────────
        $usersByRole = User::selectRaw('role, count(*) as total')
            ->groupBy('role')
            ->pluck('total', 'role')
            ->toArray();

        $roles = ['user', 'waste_bank', 'developer', 'community'];
        foreach ($roles as $role) {
            $usersByRole[$role] ??= 0;
        }

        // ── Counts ────────────────────────────────────────────────────────
        $totalScans = WasteScan::count();
        $totalDeposits = Deposit::count();
        $pendingDiySubmissions = DiySubmission::where('status', 'pending')->count();
        $pendingWasteBanks = WasteBank::where('verification_status', 'pending')->count();

        // ── ML summary (24 jam terakhir) ──────────────────────────────────
        $since = now()->subHours(24);
        $mlLogs = MlApiLog::where('created_at', '>=', $since);
        $mlTotal = (clone $mlLogs)->count();

        $mlSuccess = (clone $mlLogs)->where('status', 'success')->count();
        $mlSuccessRate = $mlTotal > 0 ? round(($mlSuccess / $mlTotal) * 100, 1) : null;
        $mlAvgMs = (clone $mlLogs)->where('status', 'success')->avg('response_time_ms');

        return response()->json([
            'data' => [
                'users_by_role' => $usersByRole,
                'total_users' => array_sum($usersByRole),
                'total_scans' => $totalScans,
                'total_deposits' => $totalDeposits,
                'pending_diy_submissions' => $pendingDiySubmissions,
                'pending_waste_banks' => $pendingWasteBanks,
                'ml_summary_24h' => [
                    'total_calls' => $mlTotal,
                    'success_count' => $mlSuccess,
                    'success_rate' => $mlSuccessRate,
                    'avg_response_ms' => $mlAvgMs ? round($mlAvgMs) : null,
                ],
            ],
        ]);
    }
}
