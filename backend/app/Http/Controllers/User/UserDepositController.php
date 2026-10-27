<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserDepositRequest;
use App\Http\Resources\DepositItemResource;
use App\Models\Deposit;
use App\Models\WasteBank;
use App\Models\WasteCategory;
use App\Notifications\DepositRecorded;
use App\Services\PointService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UserDepositController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly PointService $pointService) {}

    /**
     * GET /api/user/deposits
     * Riwayat setoran milik user yang sedang login; paginasi 15 per halaman.
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
                'items' => DepositItemResource::collection($deposit->items)->resolve(),
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
                'items' => DepositItemResource::collection($deposit->items)->resolve(),
                'created_at' => $deposit->created_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * POST /api/user/deposits
     * User membuat setoran sendiri (self-service).
     *
     * Body:
     *  - waste_bank_id          : int (required)
     *  - notes                  : string|null
     *  - items[]                : array (min 1)
     *    - waste_category_id    : int
     *    - weight_kg            : float (min 0.01)
     */
    public function store(StoreUserDepositRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        // Ambil bank sampah — harus verified
        $wasteBank = WasteBank::verified()->findOrFail($validated['waste_bank_id']);

        // Validasi semua kategori diterima oleh bank ini
        $acceptedIds = $wasteBank->acceptedCategories()->pluck('waste_categories.id')->toArray();
        $requestedIds = array_column($validated['items'], 'waste_category_id');
        $rejected = array_diff($requestedIds, $acceptedIds);

        if (! empty($rejected)) {
            throw ValidationException::withMessages([
                'items' => ['Beberapa kategori tidak diterima oleh bank sampah ini.'],
            ]);
        }

        // Muat kategori sekaligus untuk points_per_kg
        $categories = WasteCategory::whereIn('id', $requestedIds)->get()->keyBy('id');

        $deposit = DB::transaction(function () use ($wasteBank, $user, $validated, $categories): Deposit {
            $totalWeight = 0;
            $totalPoints = 0;
            $itemsData = [];

            foreach ($validated['items'] as $item) {
                $cat = $categories[$item['waste_category_id']];
                $points = (int) round($item['weight_kg'] * $cat->points_per_kg);

                $totalWeight += $item['weight_kg'];
                $totalPoints += $points;

                $itemsData[] = [
                    'waste_category_id' => $cat->id,
                    'weight_kg' => $item['weight_kg'],
                    'points' => $points,
                ];
            }

            // recorded_by = user itu sendiri (self-service)
            $deposit = Deposit::create([
                'waste_bank_id' => $wasteBank->id,
                'user_id' => $user->id,
                'recorded_by' => $user->id,
                'notes' => $validated['notes'] ?? null,
                'total_weight_kg' => $totalWeight,
                'total_points' => $totalPoints,
            ]);

            $deposit->items()->createMany($itemsData);
            $deposit->load('wasteBank');

            $this->pointService->creditDeposit($user, $deposit, $totalPoints);

            return $deposit->loadMissing(['items.wasteCategory', 'depositor', 'recorder']);
        });

        // Notifikasi setelah commit
        $user->notify(new DepositRecorded($deposit, $deposit->total_points));

        return $this->successResponse([
            'id' => $deposit->id,
            'waste_bank_name' => $deposit->wasteBank->name,
            'total_weight_kg' => (float) $deposit->total_weight_kg,
            'total_points' => $deposit->total_points,
            'items' => DepositItemResource::collection($deposit->items)->resolve(),
            'created_at' => $deposit->created_at?->toIso8601String(),
        ], 'Setoran berhasil dicatat! Poin telah dikreditkan ke akunmu.', 201);
    }
}
