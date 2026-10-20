<?php

namespace App\Http\Controllers\WasteBank;

use App\Http\Controllers\Controller;
use App\Http\Requests\WasteBank\SyncCategoriesRequest;
use App\Http\Requests\WasteBank\UpdateProfileRequest;
use App\Http\Resources\WasteBankProfileResource;
use App\Http\Resources\WasteCategoryResource;
use App\Models\WasteCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    /**
     * GET /api/waste-bank/profile
     */
    public function show(Request $request): JsonResponse
    {
        $wasteBank = $request->user()
            ->wasteBank()
            ->with('acceptedCategories')
            ->firstOrFail();

        return response()->json([
            'data' => new WasteBankProfileResource($wasteBank),
        ]);
    }

    /**
     * PUT /api/waste-bank/profile
     */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $wasteBank = $request->user()->wasteBank()->firstOrFail();

        $wasteBank->update($request->validated());
        $wasteBank->load('acceptedCategories');

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'data' => new WasteBankProfileResource($wasteBank),
        ]);
    }

    /**
     * PATCH /api/waste-bank/status
     * Toggle is_open.
     */
    public function toggleStatus(Request $request): JsonResponse
    {
        $wasteBank = $request->user()->wasteBank()->firstOrFail();

        $wasteBank->update(['is_open' => ! $wasteBank->is_open]);

        return response()->json([
            'message' => $wasteBank->is_open
                ? 'Bank sampah sekarang ditandai Buka.'
                : 'Bank sampah sekarang ditandai Tutup.',
            'is_open' => $wasteBank->is_open,
        ]);
    }

    /**
     * PUT /api/waste-bank/categories
     * Sync kategori yang diterima. Hanya kategori is_recyclable = true.
     */
    public function syncCategories(SyncCategoriesRequest $request): JsonResponse
    {
        $wasteBank = $request->user()->wasteBank()->firstOrFail();

        // Filter ke kategori yang memang bisa didaur ulang
        $validIds = WasteCategory::whereIn('id', $request->category_ids)
            ->where('is_recyclable', true)
            ->pluck('id')
            ->toArray();

        $wasteBank->acceptedCategories()->sync($validIds);
        $wasteBank->load('acceptedCategories');

        return response()->json([
            'message' => 'Kategori berhasil diperbarui.',
            'data' => new WasteBankProfileResource($wasteBank),
        ]);
    }

    /**
     * GET /api/waste-bank/categories/available
     * Semua kategori yang is_recyclable — untuk ditampilkan di checklist.
     */
    public function availableCategories(): JsonResponse
    {
        $categories = WasteCategory::where('is_recyclable', true)
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => WasteCategoryResource::collection($categories),
        ]);
    }
}
