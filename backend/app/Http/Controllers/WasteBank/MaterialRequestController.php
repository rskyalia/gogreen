<?php

namespace App\Http\Controllers\WasteBank;

use App\Http\Controllers\Controller;
use App\Http\Resources\MaterialRequestResource;
use App\Http\Resources\MaterialRequestResponseResource;
use App\Models\MaterialRequest;
use App\Models\MaterialRequestResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MaterialRequestController extends Controller
{
    /**
     * GET /api/waste-bank/material-requests
     * Permintaan berstatus open, difilter ke kategori yang diterima bank ini.
     */
    public function index(Request $request): JsonResponse
    {
        $wasteBank = $request->user()->wasteBank()->firstOrFail();
        $acceptedCatIds = $wasteBank->acceptedCategories()->pluck('waste_categories.id');

        $query = MaterialRequest::open()
            ->whereIn('waste_category_id', $acceptedCatIds)
            ->with(['community:id,name', 'wasteCategory'])
            ->withCount('responses')
            ->latest();

        // Opsional: filter by category
        if ($request->filled('category_id')) {
            $query->where('waste_category_id', $request->category_id);
        }

        $requests = $query->paginate(15);

        return response()->json([
            'data' => MaterialRequestResource::collection($requests->items()),
            'meta' => [
                'current_page' => $requests->currentPage(),
                'last_page' => $requests->lastPage(),
                'total' => $requests->total(),
            ],
        ]);
    }

    /**
     * POST /api/waste-bank/material-requests/{id}/responses
     * Buat tawaran baru (status offered).
     */
    public function respond(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'quantity_offered_kg' => ['required', 'numeric', 'min:0.01'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $materialRequest = MaterialRequest::open()->findOrFail($id);

        // Cek: petugas belum pernah respond ke request yang sama
        $alreadyResponded = MaterialRequestResponse::where([
            'material_request_id' => $id,
            'responder_id' => $request->user()->id,
        ])->exists();

        if ($alreadyResponded) {
            return response()->json([
                'message' => 'Anda sudah memberikan tawaran untuk permintaan ini.',
                'errors' => ['response' => ['Tawaran sudah ada.']],
            ], 422);
        }

        $response = MaterialRequestResponse::create([
            'material_request_id' => $materialRequest->id,
            'responder_id' => $request->user()->id,
            'quantity_offered_kg' => $request->quantity_offered_kg,
            'notes' => $request->notes,
            'status' => 'offered',
        ]);

        $response->load('materialRequest.wasteCategory');

        return response()->json([
            'message' => 'Tawaran berhasil dikirimkan.',
            'data' => new MaterialRequestResponseResource($response),
        ], 201);
    }

    /**
     * PATCH /api/waste-bank/responses/{id}/delivered
     * Tandai tawaran milik saya sebagai terkirim. Hanya jika status = accepted.
     */
    public function markDelivered(Request $request, int $id): JsonResponse
    {
        $response = MaterialRequestResponse::where('responder_id', $request->user()->id)
            ->findOrFail($id);

        if ($response->status !== 'accepted') {
            return response()->json([
                'message' => 'Hanya tawaran yang diterima (accepted) yang dapat ditandai terkirim.',
                'errors' => ['status' => ['Status harus accepted.']],
            ], 422);
        }

        $response->update(['status' => 'delivered']);

        $response->load('materialRequest.wasteCategory');

        return response()->json([
            'message' => 'Tawaran ditandai sebagai terkirim.',
            'data' => new MaterialRequestResponseResource($response),
        ]);
    }

    /**
     * GET /api/waste-bank/responses
     * Semua tawaran milik petugas ini beserta statusnya.
     */
    public function myResponses(Request $request): JsonResponse
    {
        $responses = MaterialRequestResponse::where('responder_id', $request->user()->id)
            ->with(['materialRequest.wasteCategory', 'materialRequest.community:id,name'])
            ->latest()
            ->paginate(15);

        return response()->json([
            'data' => MaterialRequestResponseResource::collection($responses->items()),
            'meta' => [
                'current_page' => $responses->currentPage(),
                'last_page' => $responses->lastPage(),
                'total' => $responses->total(),
            ],
        ]);
    }
}
