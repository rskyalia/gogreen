<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AiCraftRecommendationService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class AiCraftRecommendationController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly AiCraftRecommendationService $aiService,
    ) {}

    /**
     * Hasilkan rekomendasi karya berbasis AI dari data hasil scan sampah.
     *
     * Request body:
     *  - object_name  : string (required) — nama objek terdeteksi dari ML
     *  - material     : string (required) — material sampah (plastik, kertas, dll.)
     *  - waste_type   : string (required) — recyclable | organic | residue
     */
    public function recommend(Request $request)
    {
        $validated = $request->validate([
            'object_name' => ['required', 'string', 'max:100'],
            'material' => ['required', 'string', 'max:100'],
            'waste_type' => ['required', 'string', 'in:recyclable,organic,residue'],
        ]);

        try {
            $result = $this->aiService->recommend(
                objectName: $validated['object_name'],
                material: $validated['material'],
                wasteType: $validated['waste_type'],
            );

            return $this->successResponse($result, 'Rekomendasi karya berhasil dibuat.');
        } catch (\RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 503);
        }
    }
}
