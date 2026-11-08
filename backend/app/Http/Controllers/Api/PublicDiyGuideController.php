<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DiyGuide;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * PublicDiyGuideController
 *
 * Endpoint publik (tanpa auth) untuk panduan DIY yang sudah dipublikasikan.
 * Dipakai oleh halaman Komunitas DIY di dashboard user.
 */
class PublicDiyGuideController extends Controller
{
    /**
     * GET /api/diy-guides
     *
     * Query params:
     *   search      – filter judul (case-insensitive)
     *   category_id – filter berdasarkan waste_category_id
     *   difficulty  – easy | medium | hard
     */
    public function index(Request $request): JsonResponse
    {
        $query = DiyGuide::published()
            ->with(['wasteCategory:id,name,slug', 'creator:id,name'])
            ->when(
                $request->filled('search'),
                fn ($q) => $q->where('title', 'ilike', '%'.$request->search.'%'),
            )
            ->when(
                $request->filled('category_id'),
                fn ($q) => $q->where('waste_category_id', $request->category_id),
            )
            ->when(
                $request->filled('difficulty'),
                fn ($q) => $q->where('difficulty', $request->difficulty),
            )
            ->orderByDesc('created_at');

        $guides = $query->paginate((int) ($request->per_page ?? 20));

        return response()->json([
            'data' => array_map(
                fn ($g) => $this->format($g),
                $guides->items(),
            ),
            'meta' => [
                'current_page' => $guides->currentPage(),
                'last_page' => $guides->lastPage(),
                'total' => $guides->total(),
                'per_page' => $guides->perPage(),
            ],
        ]);
    }

    /**
     * GET /api/diy-guides/{id}
     */
    public function show(int $id): JsonResponse
    {
        $guide = DiyGuide::published()
            ->with(['wasteCategory:id,name,slug', 'creator:id,name'])
            ->findOrFail($id);

        return response()->json(['data' => $this->format($guide)]);
    }

    /**
     * Format satu DiyGuide menjadi array response.
     */
    private function format(DiyGuide $g): array
    {
        $apiBase = rtrim(config('app.url'), '/');

        return [
            'id' => $g->id,
            'title' => $g->title,
            'description' => $g->description,
            'difficulty' => $g->difficulty,
            'estimated_minutes' => $g->estimated_minutes,
            'materials' => $g->materials ?? [],
            'steps' => $g->steps ?? [],
            'cover_image' => $g->cover_image
                ? "{$apiBase}/storage/{$g->cover_image}"
                : null,
            'video_url' => $g->video_url,
            'reward_points' => $g->reward_points,
            'waste_category' => $g->wasteCategory
                ? ['id' => $g->wasteCategory->id, 'name' => $g->wasteCategory->name, 'slug' => $g->wasteCategory->slug]
                : null,
            'creator' => $g->creator
                ? ['id' => $g->creator->id, 'name' => $g->creator->name]
                : null,
            'created_at' => $g->created_at?->toIso8601String(),
        ];
    }
}
