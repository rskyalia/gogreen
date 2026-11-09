<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\DraftDeposit;
use App\Models\User;
use App\Models\WasteBank;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * DraftDepositService
 *
 * Mengelola draft setoran:
 * - User membuat draft setoran dengan memilih bank sampah
 * - Mendapatkan QR code yang unik per draft
 * - QR code berisi: draft_id + waste_bank_id
 * - Petugas bank sampah scan QR → validasi bank sampah → lihat draft → approve/edit
 */
class DraftDepositService
{
    public const TTL_DRAFT_SEC = 15 * 60; // 15 menit

    // ── Buat draft setoran baru ───────────────────────────────────────────

    /**
     * User membuat draft setoran baru dengan memilih bank sampah.
     *
     * @param  array{waste_bank_id: int, notes?: string, items: array}  $data
     * @return array{draft_id: int, qr_token: string, payload: string, expires_at: string}
     *
     * @throws ApiException
     * @throws ValidationException
     */
    public function create(User $user, array $data): array
    {
        // Batalkan draft pending yang lama jika ada
        $this->cancelPendingDrafts($user->id);

        $wasteBank = WasteBank::verified()->findOrFail($data['waste_bank_id']);

        // Validasi kategori diterima bank ini
        $acceptedIds = $wasteBank->acceptedCategories()->pluck('waste_categories.id')->toArray();
        $requestedIds = array_column($data['items'], 'waste_category_id');
        $rejected = array_diff($requestedIds, $acceptedIds);

        if (! empty($rejected)) {
            throw ValidationException::withMessages([
                'items' => ['Beberapa kategori tidak diterima oleh bank sampah ini.'],
            ]);
        }

        return DB::transaction(function () use ($user, $wasteBank, $data): array {
            $token = Str::random(32);
            $expiresAt = now()->addSeconds(self::TTL_DRAFT_SEC);

            $draft = DraftDeposit::create([
                'user_id' => $user->id,
                'waste_bank_id' => $wasteBank->id,
                'qr_token' => $token,
                'status' => 'pending',
                'notes' => $data['notes'] ?? null,
                'expires_at' => $expiresAt,
            ]);

            // Simpan items
            foreach ($data['items'] as $item) {
                $draft->items()->create([
                    'waste_category_id' => $item['waste_category_id'],
                    'weight_kg' => $item['weight_kg'],
                ]);
            }

            return [
                'draft_id' => $draft->id,
                'qr_token' => $token,
                'payload' => $this->buildPayload($token),
                'expires_at' => $expiresAt->toIso8601String(),
            ];
        });
    }

    // ── Batalkan semua draft pending user ─────────────────────────────────

    private function cancelPendingDrafts(int $userId): void
    {
        DraftDeposit::where('user_id', $userId)
            ->where('status', 'pending')
            ->update(['status' => 'expired']);
    }

    // ── Ambil draft dari QR token ─────────────────────────────────────────

    /**
     * Petugas bank sampah scan QR → ambil draft deposit.
     *
     * Validasi:
     * - Draft harus pending
     * - Draft belum expired
     * - waste_bank_id harus cocok dengan bank petugas
     *
     * @throws ApiException
     */
    public function findByToken(string $token, int $wasteBankId): DraftDeposit
    {
        $draft = DraftDeposit::with(['user', 'wasteBank', 'items.wasteCategory'])
            ->where('qr_token', $token)
            ->first();

        if (! $draft) {
            throw ApiException::make('token_invalid', 'QR code tidak valid.', 404);
        }

        if ($draft->status !== 'pending') {
            throw ApiException::make('draft_already_processed', 'Setoran ini sudah diproses.', 409);
        }

        if ($draft->isExpired()) {
            $draft->markExpired();
            throw ApiException::make('token_expired', 'QR code telah kedaluwarsa.', 422);
        }

        if ($draft->waste_bank_id !== $wasteBankId) {
            throw ApiException::make(
                'wrong_waste_bank',
                'QR code ini untuk bank sampah lain. Setoran harus dilakukan di bank sampah yang dipilih saat membuat setoran.',
                403,
            );
        }

        return $draft;
    }

    // ── Status draft (untuk polling user) ─────────────────────────────────

    /**
     * User polling status draft.
     *
     * @return array{status: string, deposit_id?: int}
     *
     * @throws ApiException jika token bukan milik user
     */
    public function getStatus(string $token, User $user): array
    {
        $draft = DraftDeposit::where('qr_token', $token)->first();

        if (! $draft || $draft->user_id !== $user->id) {
            throw ApiException::make('token_invalid', 'QR code tidak ditemukan.', 404);
        }

        if ($draft->status === 'pending' && $draft->isExpired()) {
            $draft->markExpired();
        }

        return [
            'status' => $draft->status,
            'waste_bank_name' => $draft->wasteBank->name,
            'expires_at' => $draft->expires_at?->toIso8601String(),
        ];
    }

    // ── Build payload ─────────────────────────────────────────────────────

    public function buildPayload(string $token): string
    {
        return 'gogreen://deposit/'.$token;
    }
}
