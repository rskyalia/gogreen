<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Reward;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RewardController extends Controller
{
    /**
     * GET /api/admin/rewards
     */
    public function index(Request $request): JsonResponse
    {
        $rewards = Reward::when($request->search, function ($q, $s) {
            $q->where('name', 'like', "%{$s}%");
        })
            ->when($request->has('active'), fn ($q) => $q->where('is_active', (bool) $request->active))
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => $rewards->items(),
            'meta' => [
                'current_page' => $rewards->currentPage(),
                'last_page' => $rewards->lastPage(),
                'total' => $rewards->total(),
                'per_page' => $rewards->perPage(),
            ],
        ]);
    }

    /**
     * POST /api/admin/rewards
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'string', 'max:500'],
            'points_cost' => ['required', 'integer', 'min:1'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        $validated['created_by'] = $request->user()->id;

        $reward = Reward::create($validated);

        return response()->json([
            'message' => 'Reward berhasil dibuat.',
            'data' => $reward,
        ], 201);
    }

    /**
     * GET /api/admin/rewards/{id}
     */
    public function show(int $id): JsonResponse
    {
        $reward = Reward::findOrFail($id);

        return response()->json(['data' => $reward]);
    }

    /**
     * PUT /api/admin/rewards/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $reward = Reward::findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'string', 'max:500'],
            'points_cost' => ['sometimes', 'integer', 'min:1'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        $reward->update($validated);

        return response()->json([
            'message' => 'Reward berhasil diperbarui.',
            'data' => $reward->fresh(),
        ]);
    }

    /**
     * DELETE /api/admin/rewards/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $reward = Reward::findOrFail($id);
        $reward->delete();

        return response()->json(['message' => 'Reward berhasil dihapus.']);
    }
}
