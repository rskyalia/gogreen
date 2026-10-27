<?php

namespace App\Http\Controllers\WasteBank;

use App\Http\Controllers\Controller;
use App\Http\Requests\WasteBank\MemberLookupRequest;
use App\Http\Requests\WasteBank\StoreDepositRequest;
use App\Http\Resources\DepositResource;
use App\Http\Resources\MemberResource;
use App\Models\User;
use App\Services\DepositService;
use App\Services\QrTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DepositController extends Controller
{
    public function __construct(
        private readonly DepositService $depositService,
        private readonly QrTokenService $qrTokenService,
    ) {}

    /**
     * GET /api/waste-bank/members/lookup?token=  ATAU  ?code=
     *
     * Mode token  : active → claimed; claimed by same bank → ok; claimed by other → 409.
     * Mode code   : member_code manual (cadangan), tanpa klaim.
     *
     * Return: id, name, avatar, member_code ONLY (NO email/phone).
     */
    public function findMember(MemberLookupRequest $request): JsonResponse
    {
        $wasteBank = $request->user()->wasteBank()->firstOrFail();

        $token = $request->validated('token');
        $code = $request->validated('code');

        // ── Mode token ────────────────────────────────────────────────────
        if (filled($token)) {
            $claimResult = $this->qrTokenService->claim((string) $token, $wasteBank->id);

            if (! $claimResult['success']) {
                $errorCode = $claimResult['code'] ?? 'token_invalid';
                $httpStatus = match ($errorCode) {
                    'token_claimed_by_other', 'token_used' => 409,
                    default => 422,
                };
                $message = match ($errorCode) {
                    'token_expired' => 'Token QR telah kedaluwarsa.',
                    'token_used' => 'Token QR sudah pernah digunakan.',
                    'token_claimed_by_other' => 'Token QR sedang diproses oleh bank sampah lain.',
                    default => 'Token QR tidak valid.',
                };

                $this->logFailedLookup($wasteBank->id, $errorCode, (string) $token);

                return $this->lookupError($message, $errorCode, $httpStatus);
            }

            $payload = $claimResult['payload'];
            $member = User::find($payload['user_id']);

            if (! $member) {
                $this->logFailedLookup($wasteBank->id, 'user_not_found', (string) $token);

                return $this->lookupError('Akun member tidak ditemukan.', 'user_not_found', 404);
            }

            if ($member->isBanned()) {
                $this->logFailedLookup($wasteBank->id, 'user_banned', (string) $token);

                return $this->lookupError('Akun member ini telah diblokir.', 'user_banned', 403);
            }

            if (! $member->isUser()) {
                $this->logFailedLookup($wasteBank->id, 'user_not_found', (string) $token);

                return $this->lookupError('Identitas yang diberikan bukan milik anggota.', 'user_not_found', 404);
            }

            return response()->json([
                'data' => new MemberResource($member),
                'claim_expires_at' => $payload['expires_at'] ?? null,
            ]);
        }

        // ── Mode member_code (cadangan) ────────────────────────────────────
        try {
            $member = $this->depositService->findMember((string) $code);

            return response()->json(['data' => new MemberResource($member)]);
        } catch (ValidationException $e) {
            $errorCode = isset($e->errors()['banned']) ? 'user_banned' : 'user_not_found';
            $httpStatus = $errorCode === 'user_banned' ? 403 : 404;

            Log::info('Member lookup gagal (code)', [
                'waste_bank' => $wasteBank->id,
                'error_code' => $errorCode,
            ]);

            return response()->json([
                'message' => $e->validator->errors()->first(),
                'code' => $errorCode,
                'errors' => $e->errors(),
            ], $httpStatus);
        }
    }

    private function lookupError(string $message, string $code, int $status): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'code' => $code,
            'errors' => [],
        ], $status);
    }

    /**
     * Catat percobaan lookup gagal tanpa menuliskan token penuh ke log.
     */
    private function logFailedLookup(int $wasteBankId, string $errorCode, string $token): void
    {
        Log::warning('QR lookup gagal', [
            'error_code' => $errorCode,
            'waste_bank' => $wasteBankId,
            'token_prefix' => substr($token, 0, 6).'...',
        ]);
    }

    /**
     * GET /api/waste-bank/deposit-categories
     * Kategori yang diterima bank ini: id, name, icon, points_per_kg.
     */
    public function depositCategories(Request $request): JsonResponse
    {
        $wasteBank = $request->user()->wasteBank()->firstOrFail();

        $categories = $wasteBank->acceptedCategories()
            ->where('is_active', true)
            ->get(['waste_categories.id', 'waste_categories.name', 'waste_categories.icon', 'waste_categories.points_per_kg'])
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'icon' => $c->icon,
                'points_per_kg' => $c->points_per_kg,
            ])
            ->values();

        return response()->json(['data' => $categories]);
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
            $request->validated(),
        );

        $newBalance = $deposit->depositor->fresh()->points_balance;

        return response()->json([
            'message' => 'Setoran berhasil dicatat.',
            'data' => new DepositResource($deposit),
            'member_balance' => $newBalance,
        ], 201, [], JSON_PRESERVE_ZERO_FRACTION);
    }

    /**
     * GET /api/waste-bank/deposits
     */
    public function index(Request $request): JsonResponse
    {
        $wasteBank = $request->user()->wasteBank()->firstOrFail();

        $query = $wasteBank->deposits()
            ->with(['depositor', 'recorder', 'items.wasteCategory'])
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

        $deposit = $wasteBank->deposits()
            ->with(['depositor', 'recorder', 'items.wasteCategory'])
            ->findOrFail($id);

        return response()->json(['data' => new DepositResource($deposit)]);
    }

    /**
     * GET /api/waste-bank/deposits/export
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
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['ID', 'Tanggal', 'Nama Member', 'Kode Member', 'Kategori', 'Berat (kg)', 'Poin', 'Total Berat', 'Total Poin', 'Catatan']);
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
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
