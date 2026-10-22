<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\WasteBankResource;
use App\Models\WasteBank;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class WasteBankController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = WasteBank::with(['owner', 'verifier'])
            ->when($request->status, fn ($q, $s) => $q->where('verification_status', $s))
            ->when($request->search, function ($q, $s) {
                $q->where(function ($inner) use ($s) {
                    $inner->where('name', 'like', "%{$s}%")
                        ->orWhere('address', 'like', "%{$s}%");
                });
            })
            ->orderBy('created_at', 'desc');

        $banks = $query->paginate(15);

        return response()->json([
            'data' => WasteBankResource::collection($banks->items()),
            'meta' => [
                'current_page' => $banks->currentPage(),
                'last_page' => $banks->lastPage(),
                'total' => $banks->total(),
                'per_page' => $banks->perPage(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $bank = WasteBank::with(['owner', 'verifier', 'acceptedCategories'])->findOrFail($id);

        return response()->json(['data' => new WasteBankResource($bank)]);
    }

    public function verify(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['verified', 'rejected'])],
            'reason' => [
                Rule::requiredIf(fn () => $request->status === 'rejected'),
                'nullable',
                'string',
                'max:500',
            ],
        ]);

        $bank = WasteBank::with('owner')->findOrFail($id);

        $bank->update([
            'verification_status' => $validated['status'],
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
        ]);

        $message = $validated['status'] === 'verified'
            ? 'Bank sampah berhasil diverifikasi.'
            : 'Bank sampah ditolak.';

        return response()->json([
            'message' => $message,
            'data' => new WasteBankResource($bank->fresh(['owner', 'verifier'])),
        ]);
    }
}
