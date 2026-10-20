<?php

namespace App\Http\Controllers\WasteBank;

use App\Http\Controllers\Controller;
use App\Http\Requests\WasteBank\StoreDepositRequest;
use App\Http\Resources\DepositResource;
use App\Http\Resources\MemberResource;
use App\Services\DepositService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DepositController extends Controller
{
    public function __construct(private readonly DepositService $depositService) {}

    /**
     * GET /api/waste-bank/members/{member_code}
     * Cari anggota sebelum membuat setoran.
     */
    public function findMember(Request $request, string $memberCode): JsonResponse
    {
        $member = $this->depositService->findMember($memberCode);

        return response()->json([
            'data' => new MemberResource($member),
        ]);
    }

    /**
     * POST /api/waste-bank/deposits
     */
    public function store(StoreDepositRequest $request): JsonResponse
    {
        $wasteBank = $request->user()->wasteBank()->firstOrFail();

        $deposit = $this->depositService->store(
            $wasteBank,
            $request->user(),
            $request->validated()
        );

        // Ambil saldo terbaru setelah dikreditkan
        $newBalance = $deposit->depositor->fresh()->points_balance;

        return response()->json([
            'message' => 'Setoran berhasil dicatat.',
            'data' => new DepositResource($deposit),
            'member_balance' => $newBalance,
        ], 201);
    }

    /**
     * GET /api/waste-bank/deposits
     * Paginasi + filter tanggal, kategori, search nama user.
     */
    public function index(Request $request): JsonResponse
    {
        $wasteBank = $request->user()->wasteBank()->firstOrFail();

        $query = $wasteBank->deposits()
            ->with(['depositor', 'recorder', 'items.wasteCategory'])
            ->latest();

        // Filter tanggal
        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        // Filter kategori
        if ($request->filled('category_id')) {
            $query->whereHas('items', function ($q) use ($request) {
                $q->where('waste_category_id', $request->category_id);
            });
        }

        // Search nama member
        if ($request->filled('search')) {
            $query->whereHas('depositor', function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%');
            });
        }

        $deposits = $query->paginate(15);

        return response()->json([
            'data' => DepositResource::collection($deposits->items()),
            'meta' => [
                'current_page' => $deposits->currentPage(),
                'last_page' => $deposits->lastPage(),
                'total' => $deposits->total(),
                'per_page' => $deposits->perPage(),
            ],
        ]);
    }

    /**
     * GET /api/waste-bank/deposits/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $wasteBank = $request->user()->wasteBank()->firstOrFail();

        // Scope ke waste_bank_id agar bank A tidak bisa melihat milik bank B
        $deposit = $wasteBank->deposits()
            ->with(['depositor', 'recorder', 'items.wasteCategory'])
            ->findOrFail($id);

        return response()->json([
            'data' => new DepositResource($deposit),
        ]);
    }

    /**
     * GET /api/waste-bank/deposits/export
     * Streaming CSV sesuai filter aktif.
     */
    public function export(Request $request): StreamedResponse
    {
        $wasteBank = $request->user()->wasteBank()->firstOrFail();

        $query = $wasteBank->deposits()
            ->with(['depositor', 'items.wasteCategory'])
            ->latest();

        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }
        if ($request->filled('category_id')) {
            $query->whereHas('items', function ($q) use ($request) {
                $q->where('waste_category_id', $request->category_id);
            });
        }
        if ($request->filled('search')) {
            $query->whereHas('depositor', function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%');
            });
        }

        $filename = 'setoran-'.now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');
            // BOM untuk Excel (UTF-8)
            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'ID', 'Tanggal', 'Nama Member', 'Kode Member',
                'Kategori', 'Berat (kg)', 'Poin', 'Total Berat', 'Total Poin', 'Catatan',
            ]);

            $query->chunk(200, function ($deposits) use ($handle) {
                foreach ($deposits as $deposit) {
                    foreach ($deposit->items as $item) {
                        fputcsv($handle, [
                            $deposit->id,
                            $deposit->created_at->format('Y-m-d H:i'),
                            $deposit->depositor->name,
                            $deposit->depositor->member_code,
                            $item->wasteCategory->name,
                            $item->weight_kg,
                            $item->points,
                            $deposit->total_weight_kg,
                            $deposit->total_points,
                            $deposit->notes ?? '',
                        ]);
                    }
                }
            });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
