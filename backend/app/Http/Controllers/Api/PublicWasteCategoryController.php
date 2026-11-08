<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WasteCategory;
use Illuminate\Http\JsonResponse;

class PublicWasteCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = WasteCategory::active()
            ->select('id', 'name', 'slug', 'description', 'is_recyclable', 'is_upcyclable', 'points_per_kg', 'icon')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $categories,
        ]);
    }
}
