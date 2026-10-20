<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MlApiLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MlStatusController extends Controller
{
    /**
     * GET /api/admin/ml-status?range=24h|7d|30d
     *
     * Mengembalikan:
     * - total_calls, success_rate, avg_response_ms, p95_response_ms
     * - 10 error terakhir
     * - deret waktu (per jam untuk 24h, per hari untuk range lain)
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'range' => ['nullable', Rule::in(['24h', '7d', '30d'])],
        ]);

        $range = $validated['range'] ?? '24h';

        [$since, $groupFormat, $labelFormat] = match ($range) {
            '24h' => [now()->subHours(24), '%Y-%m-%d %H:00:00', 'hour'],
            '7d' => [now()->subDays(7),   '%Y-%m-%d',          'day'],
            '30d' => [now()->subDays(30),  '%Y-%m-%d',          'day'],
        };

        $baseQuery = MlApiLog::where('created_at', '>=', $since);

        // ── Aggregates ────────────────────────────────────────────────────
        $total = (clone $baseQuery)->count();
        $success = (clone $baseQuery)->where('status', 'success')->count();

        $successRate = $total > 0 ? round(($success / $total) * 100, 1) : null;

        $successLogs = (clone $baseQuery)->where('status', 'success');
        $avgMs = (clone $successLogs)->avg('response_time_ms');

        // P95 — recupera os ms e calcula o percentil manualmente
        $responseTimes = (clone $successLogs)
            ->orderBy('response_time_ms')
            ->pluck('response_time_ms')
            ->toArray();

        $p95 = $this->percentile($responseTimes, 95);

        // ── 10 últimos erros ──────────────────────────────────────────────
        $recentErrors = (clone $baseQuery)
            ->where('status', 'error')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get(['id', 'model_name', 'error_message', 'response_time_ms', 'created_at']);

        // ── Time series ───────────────────────────────────────────────────
        $timeSeries = (clone $baseQuery)
            ->selectRaw("DATE_FORMAT(created_at, '{$groupFormat}') as period")
            ->selectRaw('count(*) as total_calls')
            ->selectRaw("SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count")
            ->selectRaw('AVG(CASE WHEN status = \'success\' THEN response_time_ms END) as avg_ms')
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        return response()->json([
            'data' => [
                'range' => $range,
                'total_calls' => $total,
                'success_count' => $success,
                'success_rate' => $successRate,
                'avg_response_ms' => $avgMs ? round($avgMs) : null,
                'p95_response_ms' => $p95,
                'recent_errors' => $recentErrors,
                'time_series' => $timeSeries,
            ],
        ]);
    }

    /**
     * Hitung persentil dari array yang sudah diurutkan.
     *
     * @param  int[]  $sorted
     */
    private function percentile(array $sorted, int $pct): ?int
    {
        if (empty($sorted)) {
            return null;
        }

        $count = count($sorted);
        $index = (int) ceil(($pct / 100) * $count) - 1;

        return $sorted[max(0, min($index, $count - 1))];
    }
}
