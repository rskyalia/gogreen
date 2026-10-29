<?php

namespace App\Http\Controllers\Community;

use App\Http\Controllers\Controller;
use App\Models\MaterialRequest;
use App\Models\WasteCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MaterialRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $requests = MaterialRequest::with(['community:id,name', 'wasteCategory:id,name'])
            ->where('community_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json([
            'data' => $requests->map(function (MaterialRequest $requestItem) {
                return [
                    'id' => $requestItem->id,
                    'permintaan_bahan' => $requestItem->permintaan_bahan ?? $requestItem->notes ?? 'Permintaan bahan daur ulang',
                    'title' => $requestItem->permintaan_bahan ?? $requestItem->notes ?? 'Permintaan bahan daur ulang',
                    'category' => $requestItem->wasteCategory?->name ?? 'Lainnya',
                    'quantity' => $requestItem->quantity_needed_kg ? $requestItem->quantity_needed_kg.' kg' : 'Belum ditentukan',
                    'requester' => $requestItem->community?->name ?? 'Komunitas DIY',
                    'target_bank_sampah' => 'Bank Sampah Tujuan',
                    'location' => 'Jakarta',
                    'urgency' => 'Sedang',
                    'status' => $requestItem->status,
                    'created_at' => $requestItem->created_at?->toISOString(),
                    'description' => $requestItem->notes,
                    'quantity_needed_kg' => (float) $requestItem->quantity_needed_kg,
                    'community' => $requestItem->community ? [
                        'id' => $requestItem->community->id,
                        'name' => $requestItem->community->name,
                    ] : null,
                    'waste_category' => $requestItem->wasteCategory ? [
                        'id' => $requestItem->wasteCategory->id,
                        'name' => $requestItem->wasteCategory->name,
                    ] : null,
                ];
            }),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $permintaanBahan = $request->input('permintaan_bahan', $request->input('title'));

        $validated = $request->validate([
            'permintaan_bahan' => ['nullable', 'string', 'max:255'],
            'title' => ['nullable', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'quantity' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:1000'],
            'target_bank_sampah' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'urgency' => ['nullable', 'string', 'in:Rendah,Sedang,Tinggi'],
        ]);

        $validated['permintaan_bahan'] = $permintaanBahan ?: ($validated['title'] ?? null);

        if (blank($validated['permintaan_bahan'])) {
            $validated['permintaan_bahan'] = 'Permintaan bahan daur ulang';
        }

        $category = WasteCategory::firstOrCreate(
            ['name' => $validated['category']],
            [
                'slug' => Str::slug($validated['category']),
                'description' => $validated['description'] ?? 'Kategori dari permintaan komunitas',
                'is_recyclable' => true,
                'is_upcyclable' => true,
                'points_per_kg' => 0,
                'is_active' => true,
            ]
        );

        $materialRequest = MaterialRequest::create([
            'community_id' => $request->user()->id,
            'permintaan_bahan' => $validated['permintaan_bahan'] ?? $validated['title'],
            'waste_category_id' => $category->id,
            'quantity_needed_kg' => $this->parseQuantityToKg($validated['quantity']),
            'notes' => $validated['description'] ?? $validated['permintaan_bahan'] ?? $validated['title'],
            'status' => 'open',
        ]);

        $materialRequest->load(['community:id,name', 'wasteCategory:id,name']);

        return response()->json([
            'message' => 'Permintaan bahan berhasil dibuat.',
            'data' => [
                'id' => $materialRequest->id,
                'permintaan_bahan' => $materialRequest->permintaan_bahan ?? $validated['permintaan_bahan'] ?? $validated['title'],
                'title' => $materialRequest->permintaan_bahan ?? $validated['permintaan_bahan'] ?? $validated['title'],
                'category' => $materialRequest->wasteCategory?->name ?? $validated['category'],
                'quantity' => $materialRequest->quantity_needed_kg.' kg',
                'requester' => $materialRequest->community?->name ?? 'Komunitas DIY',
                'target_bank_sampah' => $validated['target_bank_sampah'] ?? 'Bank Sampah Tujuan',
                'location' => $validated['location'] ?? 'Jakarta',
                'urgency' => $validated['urgency'] ?? 'Sedang',
                'status' => $materialRequest->status,
                'created_at' => $materialRequest->created_at?->toISOString(),
                'description' => $materialRequest->notes,
                'quantity_needed_kg' => (float) $materialRequest->quantity_needed_kg,
                'community' => $materialRequest->community ? [
                    'id' => $materialRequest->community->id,
                    'name' => $materialRequest->community->name,
                ] : null,
                'waste_category' => $materialRequest->wasteCategory ? [
                    'id' => $materialRequest->wasteCategory->id,
                    'name' => $materialRequest->wasteCategory->name,
                ] : null,
            ],
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $materialRequest = MaterialRequest::where('community_id', $request->user()->id)
            ->findOrFail($id);

        $validated = $request->validate([
            'status' => ['nullable', 'string', 'in:open,fulfilled,closed'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        if (isset($validated['status'])) {
            $materialRequest->status = $validated['status'];
        }

        if (array_key_exists('notes', $validated)) {
            $materialRequest->notes = $validated['notes'];
        }

        $materialRequest->save();

        return response()->json([
            'message' => 'Permintaan bahan berhasil diperbarui.',
            'data' => $materialRequest->fresh(['community:id,name', 'wasteCategory:id,name']),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $materialRequest = MaterialRequest::where('community_id', $request->user()->id)
            ->findOrFail($id);

        $materialRequest->delete();

        return response()->json([
            'message' => 'Permintaan bahan berhasil dihapus.',
        ]);
    }

    private function parseQuantityToKg(string $quantity): float
    {
        $normalized = trim($quantity);
        if ($normalized === '') {
            return 0.0;
        }

        preg_match('/([0-9]+(?:[.,][0-9]+)?)/', $normalized, $matches);

        if (! isset($matches[1])) {
            return 0.0;
        }

        return (float) str_replace(',', '.', $matches[1]);
    }
}
