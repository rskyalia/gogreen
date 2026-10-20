<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DiyGuide;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DiyGuideController extends Controller
{
    /**
     * GET /api/admin/diy-guides
     *
     * Developer melihat semua panduan; community hanya miliknya sendiri.
     */
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $query = DiyGuide::with(['wasteCategory', 'creator'])
            ->when(! $user->isDeveloper(), fn ($q) => $q->where('created_by', $user->id))
            ->when($request->search, fn ($q, $s) => $q->where('title', 'like', "%{$s}%"))
            ->when($request->has('published'), fn ($q) => $q->where('is_published', (bool) $request->published))
            ->orderBy('created_at', 'desc');

        $guides = $query->paginate(15);

        return response()->json([
            'data' => $guides->items(),
            'meta' => [
                'current_page' => $guides->currentPage(),
                'last_page' => $guides->lastPage(),
                'total' => $guides->total(),
                'per_page' => $guides->perPage(),
            ],
        ]);
    }

    /**
     * POST /api/admin/diy-guides
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'waste_category_id' => ['required', 'integer', 'exists:waste_categories,id'],
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'difficulty' => ['required', Rule::in(['easy', 'medium', 'hard'])],
            'estimated_minutes' => ['nullable', 'integer', 'min:1'],
            'estimated_cost' => ['nullable', 'integer', 'min:0'],
            'materials' => ['nullable', 'array'],
            'materials.*' => ['string'],
            'steps' => ['nullable', 'array'],
            'steps.*' => ['string'],
            'cover_image' => ['nullable', 'string', 'max:500'],
            'video_url' => ['nullable', 'url', 'max:500'],
            'reward_points' => ['required', 'integer', 'min:0'],
            'is_published' => ['boolean'],
        ]);

        $validated['created_by'] = $request->user()->id;

        $guide = DiyGuide::create($validated);
        $guide->load(['wasteCategory', 'creator']);

        return response()->json([
            'message' => 'Panduan DIY berhasil dibuat.',
            'data' => $guide,
        ], 201);
    }

    /**
     * GET /api/admin/diy-guides/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $guide = DiyGuide::with(['wasteCategory', 'creator'])->findOrFail($id);

        // Community hanya bisa melihat miliknya sendiri
        if (! $user->isDeveloper() && $guide->created_by !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return response()->json(['data' => $guide]);
    }

    /**
     * PUT /api/admin/diy-guides/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $guide = DiyGuide::findOrFail($id);

        if (! $user->isDeveloper() && $guide->created_by !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'waste_category_id' => ['sometimes', 'integer', 'exists:waste_categories,id'],
            'title' => ['sometimes', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'difficulty' => ['sometimes', Rule::in(['easy', 'medium', 'hard'])],
            'estimated_minutes' => ['nullable', 'integer', 'min:1'],
            'estimated_cost' => ['nullable', 'integer', 'min:0'],
            'materials' => ['nullable', 'array'],
            'materials.*' => ['string'],
            'steps' => ['nullable', 'array'],
            'steps.*' => ['string'],
            'cover_image' => ['nullable', 'string', 'max:500'],
            'video_url' => ['nullable', 'url', 'max:500'],
            'reward_points' => ['sometimes', 'integer', 'min:0'],
            'is_published' => ['boolean'],
        ]);

        $guide->update($validated);

        return response()->json([
            'message' => 'Panduan DIY berhasil diperbarui.',
            'data' => $guide->fresh(['wasteCategory', 'creator']),
        ]);
    }

    /**
     * DELETE /api/admin/diy-guides/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $guide = DiyGuide::findOrFail($id);

        if (! $user->isDeveloper() && $guide->created_by !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $guide->delete();

        return response()->json(['message' => 'Panduan DIY berhasil dihapus.']);
    }
}
