<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Resources\DepositItemResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserDepositController extends Controller
{
    /**
     * GET /api/user/deposits
     * Riwayat setoran milik user yang sedang login; paginasi 15 per halaman.
     * Setiap item memuat nama bank sampah, tanggal, item (kategori, kg, poin), total poin.
     */
    public function index(Request $request): JsonResponse
    {
        $deposits = $request->user()
            ->deposits()
            ->with(['wasteBank', 'items.wasteCategory'])
            ->latest()
            ->paginate(15);

        $items = array_map(function ($deposit) {
            return [
                'id' => $deposit->id,
                'waste_bank_name' => $deposit->wasteBank->name,
                'total_weight_kg' => (float) $deposit->total_weight_kg,
                'total_points' => $deposit->total_points,
                'items' => DepositItemResource::collection(
                    $deposit->items
                )->resolve(),
                'created_at' => $deposit->created_at?->toIso8601String(),
            ];
        }, $deposits->items());

        return response()->json([
            'data' => $items,
            'meta' => [
                'current_page' => $deposits->currentPage(),
                'last_page' => $deposits->lastPage(),
                'total' => $deposits->total(),
                'per_page' => $deposits->perPage(),
            ],
        ]);
    }

    /**
     * GET /api/user/deposits/{id}
     * Detail satu setoran — hanya milik user sendiri.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $deposit = $request->user()
            ->deposits()
            ->with(['wasteBank', 'items.wasteCategory'])
            ->findOrFail($id);

        return response()->json([
            'data' => [
                'id' => $deposit->id,
                'waste_bank_name' => $deposit->wasteBank->name,
                'total_weight_kg' => (float) $deposit->total_weight_kg,
                'total_points' => $deposit->total_points,
                'notes' => $deposit->notes,
                'items' => DepositItemResource::collection(
                    $deposit->items
                )->resolve(),
                'created_at' => $deposit->created_at?->toIso8601String(),
            ],
        ]);
    }
}
