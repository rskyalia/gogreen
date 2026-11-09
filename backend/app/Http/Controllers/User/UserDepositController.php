<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserDepositRequest;
use App\Http\Resources\DepositItemResource;
use App\Services\DraftDepositService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserDepositController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly DraftDepositService $draftDepositService) {}

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
     * POST /api/user/deposits/draft
     * User membuat draft setoran dengan memilih bank sampah → mendapat QR code.
     *
     * Body:
     *  - waste_bank_id          : int (required)
     *  - notes                  : string|null
     *  - items[]                : array (min 1)
     *    - waste_category_id    : int
     *    - weight_kg            : float (min 0.01)
     */
    public function storeDraft(StoreUserDepositRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        $data = $this->draftDepositService->create($user, $validated);

        return $this->successResponse([
            'draft_id' => $data['draft_id'],
            'qr_token' => $data['qr_token'],
            'payload' => $data['payload'],
            'expires_at' => $data['expires_at'],
        ], 'Draft setoran berhasil dibuat. Tunjukkan QR code ke petugas bank sampah.', 201);
    }

    /**
     * GET /api/user/deposits/draft/status?token=
     * User polling status draft setoran.
     */
    public function draftStatus(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string|size:32',
        ]);

        $token = (string) $request->input('token');
        $user = $request->user();

        $status = $this->draftDepositService->getStatus($token, $user);

        return response()->json(['data' => $status]);
    }
}
