<?php

namespace App\Http\Controllers\WasteBank;

use App\Http\Controllers\Controller;
use App\Models\Deposit;
use App\Models\DepositItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    /**
     * GET /api/waste-bank/stats?range=7|30
     */
    public function index(Request $request): JsonResponse
    {
        $wasteBank = $request->user()->wasteBank()->firstOrFail();
        $range = in_array((int) $request->range, [7, 30]) ? (int) $request->range : 7;
        $today = now()->toDateString();
        $since = now()->subDays($range)->startOfDay();

        // Setoran hari ini
        $depositsToday = Deposit::where('waste_bank_id', $wasteBank->id)
            ->whereDate('created_at', $today)
            ->count();

        // Total kg hari ini
        $totalKgToday = Deposit::where('waste_bank_id', $wasteBank->id)
            ->whereDate('created_at', $today)
            ->sum('total_weight_kg');

        // Penyetor unik hari ini
        $uniqueDepositors = Deposit::where('waste_bank_id', $wasteBank->id)
            ->whereDate('created_at', $today)
            ->distinct('user_id')
            ->count('user_id');

        // Kg per kategori dalam range hari
        $perCategory = DepositItem::select(
            'waste_category_id',
            DB::raw('SUM(weight_kg) as total_kg'),
            DB::raw('SUM(points) as total_points')
        )
            ->whereHas('deposit', function ($q) use ($wasteBank, $since) {
                $q->where('waste_bank_id', $wasteBank->id)
                    ->where('created_at', '>=', $since);
            })
            ->with('wasteCategory:id,name,slug')
            ->groupBy('waste_category_id')
            ->get()
            ->map(fn ($row) => [
                'category_id' => $row->waste_category_id,
                'category_name' => $row->wasteCategory?->name,
                'category_slug' => $row->wasteCategory?->slug,
                'total_kg' => (float) $row->total_kg,
                'total_points' => (int) $row->total_points,
            ])
            ->values();

        return response()->json([
            'data' => [
                'deposits_today' => $depositsToday,
                'total_kg_today' => (float) $totalKgToday,
                'unique_depositors' => $uniqueDepositors,
                'per_category' => $perCategory,
                'range_days' => $range,
            ],
        ]);
    }
}
