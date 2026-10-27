<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Deposit;
use App\Models\User;
use App\Models\WasteBank;
use App\Notifications\DepositRecorded;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * DepositService
 *
 * Mengelola pembuatan setoran sampah dengan:
 *   - Idempotency via client_request_id
 *   - Integrasi QrTokenService untuk token QR
 *   - DB::transaction dengan lockForUpdate
 *   - PointService untuk kredit poin
 */
class DepositService
{
    private const IDEMPOTENCY_TTL_SEC = 10 * 60; // 10 menit

    public function __construct(
        private readonly PointService $pointService,
        private readonly QrTokenService $qrTokenService,
    ) {}

    // ── Cari member ───────────────────────────────────────────────────────

    /**
     * Cari member berdasarkan member_code (format GG-XXXXXX).
     *
     * @throws ValidationException
     */
    public function findMember(string $memberCode): User
    {
        $user = User::where('member_code', strtoupper($memberCode))->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'code' => ['Member dengan kode tersebut tidak ditemukan.'],
            ]);
        }

        $this->assertValidMember($user);

        return $user;
    }

    private function assertValidMember(User $user): void
    {
        if ($user->isBanned()) {
            throw ValidationException::withMessages([
                'banned' => ['Akun member ini telah diblokir.'],
            ]);
        }

        if ($user->role !== 'user') {
            throw ValidationException::withMessages([
                'role' => ['Identitas yang diberikan bukan milik anggota.'],
            ]);
        }
    }

    // ── Buat setoran ──────────────────────────────────────────────────────

    /**
     * Simpan setoran baru dengan idempotency check.
     *
     * @param  array{
     *   token?: string,
     *   member_code?: string,
     *   notes?: string,
     *   client_request_id: string,
     *   items: list<array{waste_category_id: int, weight_kg: float|string}>
     * }  $data
     *
     * @throws ApiException
     */
    public function store(WasteBank $wasteBank, User $recorder, array $data): Deposit
    {
        $clientRequestId = (string) $data['client_request_id'];
        $idempotencyKey = 'deposit_idem:'.$wasteBank->id.':'.$clientRequestId;
        $idempotencyLock = Cache::lock('deposit_idem_lock:'.$wasteBank->id.':'.$clientRequestId, 20);

        try {
            // Serialisasi request ganda dengan client_request_id yang sama.
            $idempotencyLock->block(5);
        } catch (LockTimeoutException) {
            throw ApiException::make(
                'request_in_progress',
                'Setoran dengan permintaan ini sedang diproses. Tunggu sebentar.',
                409,
            );
        }

        try {
            $existing = $this->findIdempotentDeposit($wasteBank, $idempotencyKey);

            if ($existing) {
                return $existing;
            }

            $categoryIds = array_map(
                static fn (array $item): int => (int) $item['waste_category_id'],
                $data['items'],
            );

            // ── Validasi duplikat kategori ────────────────────────────────
            if (count($categoryIds) !== count(array_unique($categoryIds))) {
                throw ApiException::make(
                    'validation_error',
                    'Tidak boleh ada kategori yang sama dalam satu setoran.',
                    422,
                    ['items' => ['Gabungkan berat kategori yang sama menjadi satu baris.']],
                );
            }

            // ── Validasi kategori diterima bank & aktif ───────────────────
            $categories = $wasteBank->acceptedCategories()
                ->where('waste_categories.is_active', true)
                ->whereIn('waste_categories.id', $categoryIds)
                ->get()
                ->keyBy('id');

            if (array_diff($categoryIds, $categories->keys()->all()) !== []) {
                throw ApiException::make(
                    'category_not_accepted',
                    'Beberapa kategori tidak diterima oleh bank sampah ini.',
                    422,
                    ['items' => ['Beberapa kategori tidak diterima oleh bank sampah ini.']],
                );
            }

            $token = $data['token'] ?? null;
            $tokenPayload = null;
            $tokenLock = null;

            if (filled($token)) {
                $tokenLock = Cache::lock(QrTokenService::lockKey((string) $token), 15);

                if (! $tokenLock->get()) {
                    throw ApiException::make(
                        'token_claimed_by_other',
                        'Token QR sedang diproses oleh bank sampah lain.',
                        409,
                    );
                }

                $tokenPayload = $this->assertTokenUsable((string) $token, $wasteBank->id);
            }

            try {
                $deposit = DB::transaction(function () use (
                    $wasteBank,
                    $recorder,
                    $data,
                    $categories,
                    $token,
                    $tokenPayload,
                    $idempotencyKey,
                ): Deposit {
                    // a. Kunci baris user & validasi ulang di dalam transaksi.
                    $member = $this->lockAndValidateMember($data, $tokenPayload);

                    // b. Hitung poin per item.
                    $totalWeight = 0.0;
                    $totalPoints = 0;
                    $itemsData = [];

                    foreach ($data['items'] as $item) {
                        $category = $categories[(int) $item['waste_category_id']];
                        $weight = round((float) $item['weight_kg'], 2);
                        $points = (int) round($weight * $category->points_per_kg);

                        $totalWeight += $weight;
                        $totalPoints += $points;

                        $itemsData[] = [
                            'waste_category_id' => $category->id,
                            'weight_kg' => $weight,
                            'points' => $points,
                        ];
                    }

                    // c. Buat deposit & item.
                    $deposit = Deposit::create([
                        'waste_bank_id' => $wasteBank->id,
                        'user_id' => $member->id,
                        'recorded_by' => $recorder->id,
                        'notes' => $data['notes'] ?? null,
                        'total_weight_kg' => round($totalWeight, 3),
                        'total_points' => $totalPoints,
                    ]);

                    $deposit->items()->createMany($itemsData);
                    $deposit->load('wasteBank');

                    // d + e. Tambah saldo & catat ledger dalam transaksi yang sama.
                    $this->pointService->creditDeposit($member, $deposit, $totalPoints);

                    $deposit = $deposit->loadMissing([
                        'items.wasteCategory',
                        'depositor',
                        'recorder',
                    ]);

                    // Setelah commit: hanguskan token, simpan idempotency,
                    // lalu kirim notifikasi. Semua efek samping dibungkus agar
                    // kegagalan cache/notifikasi tidak membatalkan data setoran.
                    DB::afterCommit(function () use ($token, $deposit, $idempotencyKey): void {
                        try {
                            if (filled($token)) {
                                $this->qrTokenService->markUsed((string) $token, $deposit->id);
                            }

                            Cache::put($idempotencyKey, $deposit->id, self::IDEMPOTENCY_TTL_SEC);

                            $deposit->depositor->notify(
                                new DepositRecorded($deposit, $deposit->total_points),
                            );
                        } catch (Throwable $e) {
                            Log::error('Efek samping setelah setoran gagal', [
                                'deposit_id' => $deposit->id,
                                'error' => $e->getMessage(),
                            ]);
                        }
                    });

                    return $deposit;
                });
            } finally {
                $tokenLock?->release();
            }

            return $deposit;
        } finally {
            $idempotencyLock->release();
        }
    }

    /**
     * Ambil deposit sebelumnya untuk client_request_id yang sama.
     */
    private function findIdempotentDeposit(WasteBank $wasteBank, string $idempotencyKey): ?Deposit
    {
        $existingId = Cache::get($idempotencyKey);

        if (! $existingId) {
            return null;
        }

        return Deposit::with(['wasteBank', 'items.wasteCategory', 'depositor', 'recorder'])
            ->where('waste_bank_id', $wasteBank->id)
            ->find($existingId);
    }

    /**
     * Pastikan token masih claimed oleh bank sampah ini.
     *
     * @return array{user_id: int, status: string, waste_bank_id?: int, expires_at?: string}
     *
     * @throws ApiException
     */
    private function assertTokenUsable(string $token, int $wasteBankId): array
    {
        if ($this->qrTokenService->isUsed($token)) {
            throw ApiException::make(
                'token_used',
                'Token QR sudah pernah digunakan.',
                409,
            );
        }

        $payload = $this->qrTokenService->get($token);

        if (! $payload) {
            throw ApiException::make(
                'token_expired',
                'Token QR telah kedaluwarsa.',
                422,
            );
        }

        if (($payload['status'] ?? null) === 'used') {
            throw ApiException::make('token_used', 'Token QR sudah pernah digunakan.', 409);
        }

        if (($payload['status'] ?? null) !== 'claimed') {
            throw ApiException::make(
                'token_invalid',
                'Token QR belum dipindai oleh bank sampah ini.',
                422,
            );
        }

        if ((int) ($payload['waste_bank_id'] ?? 0) !== $wasteBankId) {
            throw ApiException::make(
                'token_claimed_by_other',
                'Token QR sedang diproses oleh bank sampah lain.',
                409,
            );
        }

        return $payload;
    }

    /**
     * Kunci baris member dan validasi status/role.
     *
     * @param  array{member_code?: string}  $data
     * @param  array{user_id: int}|null  $tokenPayload
     *
     * @throws ApiException
     */
    private function lockAndValidateMember(array $data, ?array $tokenPayload): User
    {
        if ($tokenPayload) {
            $member = User::whereKey($tokenPayload['user_id'])->lockForUpdate()->first();
        } else {
            $member = User::where('member_code', strtoupper((string) ($data['member_code'] ?? '')))
                ->lockForUpdate()
                ->first();
        }

        if (! $member) {
            throw ApiException::make(
                'user_not_found',
                'Akun member tidak ditemukan.',
                404,
            );
        }

        if (! $member->isActive()) {
            throw ApiException::make(
                'user_banned',
                'Akun member ini tidak aktif atau telah diblokir.',
                403,
            );
        }

        if (! $member->isUser()) {
            throw ApiException::make(
                'user_not_found',
                'Identitas yang diberikan bukan milik anggota.',
                404,
            );
        }

        return $member;
    }
}
