<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PointLedgerController extends Controller
{
    /**
     * GET /api/user/points?type=deposit|redeem|adjustment&page=
     * Ledger point_transactions milik user; opsional filter per type.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $query = $request->user()
            ->pointTransactions()
            ->latest();

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $transactions = $query->paginate(20);

        $items = array_map(fn ($tx) => [
            'id' => $tx->id,
            'type' => $tx->type,
            'points' => $tx->points,
            'balance_after' => $tx->balance_after,
            'description' => $tx->description,
            'created_at' => $tx->created_at?->toIso8601String(),
        ], $transactions->items());

        return response()->json([
            'data' => $items,
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'total' => $transactions->total(),
                'per_page' => $transactions->perPage(),
            ],
        ]);
    }
}
