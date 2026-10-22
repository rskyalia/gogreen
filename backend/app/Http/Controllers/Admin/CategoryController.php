<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\WasteCategoryResource;
use App\Models\WasteCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CategoryController extends Controller
{
    /**
     * GET /api/admin/categories
     */
    public function index(Request $request): JsonResponse
    {
        $categories = WasteCategory::when($request->search, function ($q, $s) {
            $q->where('name', 'like', "%{$s}%");
        })
            ->when($request->has('active'), fn ($q) => $q->where('is_active', (bool) $request->active))
            ->orderBy('name')
            ->paginate(20);

        return response()->json([
            'data' => WasteCategoryResource::collection($categories->items()),
            'meta' => [
                'current_page' => $categories->currentPage(),
                'last_page' => $categories->lastPage(),
                'total' => $categories->total(),
                'per_page' => $categories->perPage(),
            ],
        ]);
    }

    /**
     * POST /api/admin/categories
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:waste_categories,name'],
            'description' => ['nullable', 'string'],
            'is_recyclable' => ['boolean'],
            'is_upcyclable' => ['boolean'],
            'points_per_kg' => ['required', 'integer', 'min:0'],
            'icon' => ['nullable', 'string', 'max:100'],
            'is_active' => ['boolean'],
        ]);

        $validated['slug'] = $this->uniqueSlug($validated['name']);

        $category = WasteCategory::create($validated);

        return response()->json([
            'message' => 'Kategori berhasil dibuat.',
            'data' => new WasteCategoryResource($category),
        ], 201);
    }

    /**
     * GET /api/admin/categories/{id}
     */
    public function show(int $id): JsonResponse
    {
        $category = WasteCategory::findOrFail($id);

        return response()->json(['data' => new WasteCategoryResource($category)]);
    }

    /**
     * PUT /api/admin/categories/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $category = WasteCategory::findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:100', "unique:waste_categories,name,{$id}"],
            'description' => ['nullable', 'string'],
            'is_recyclable' => ['boolean'],
            'is_upcyclable' => ['boolean'],
            'points_per_kg' => ['sometimes', 'integer', 'min:0'],
            'icon' => ['nullable', 'string', 'max:100'],
            'is_active' => ['boolean'],
        ]);

        if (isset($validated['name']) && $validated['name'] !== $category->name) {
            $validated['slug'] = $this->uniqueSlug($validated['name'], $id);
        }

        $category->update($validated);

        return response()->json([
            'message' => 'Kategori berhasil diperbarui.',
            'data' => new WasteCategoryResource($category->fresh()),
        ]);
    }

    /**
     * DELETE /api/admin/categories/{id}
     *
     * Tolak hapus jika kategori sudah dipakai.
     */
    public function destroy(int $id): JsonResponse
    {
        $category = WasteCategory::findOrFail($id);

        $usedInScans = $category->wasteScans()->exists();
        $usedInDeposits = $category->depositItems()->exists();
        $usedInGuides = $category->diyGuides()->exists();

        if ($usedInScans || $usedInDeposits || $usedInGuides) {
            throw ValidationException::withMessages([
                'id' => [
                    'Kategori tidak dapat dihapus karena sudah digunakan. '
                    .'Sebaiknya nonaktifkan kategori ini (set is_active = false).',
                ],
            ]);
        }

        $category->delete();

        return response()->json(['message' => 'Kategori berhasil dihapus.']);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private function uniqueSlug(string $name, ?int $exceptId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i = 1;

        while (WasteCategory::where('slug', $slug)
            ->when($exceptId, fn ($q) => $q->where('id', '!=', $exceptId))
            ->exists()
        ) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}
