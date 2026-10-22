<?php

namespace App\Services;

use App\Http\Controllers\User\MemberCardController;
use App\Models\Deposit;
use App\Models\DepositItem;
use App\Models\User;
use App\Models\WasteBank;
use App\Models\WasteCategory;
use App\Notifications\DepositRecorded;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DepositService
{
    public function __construct(private readonly PointService $pointService) {}

    /**
     * Cari member berdasarkan member_code ATAU token QR sekali pakai.
     *
     * Logika resolusi:
     *   - Jika $identifier diawali "GG-" → perlakukan sebagai member_code.
     *   - Selain itu → perlakukan sebagai token QR; cari user_id di cache.
     *
     * Mengembalikan User jika valid; melempar ValidationException jika tidak.
     *
     * @throws ValidationException
     */
    public function findMember(string $identifier): User
    {
        if (str_starts_with(strtoupper($identifier), 'GG-')) {
            return $this->findMemberByCode($identifier);
        }

        return $this->findMemberByToken($identifier);
    }

    /**
     * Cari member berdasarkan member_code.
     *
     * @throws ValidationException
     */
    private function findMemberByCode(string $memberCode): User
    {
        $user = User::where('member_code', strtoupper($memberCode))->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'identifier' => ['Member dengan kode tersebut tidak ditemukan.'],
            ]);
        }

        $this->assertValidMember($user);

        return $user;
    }

    /**
     * Cari member berdasarkan token QR.
     * Token tidak dihanguskan di sini — penghangusan dilakukan di dalam transaksi store().
     *
     * @throws ValidationException
     */
    private function findMemberByToken(string $token): User
    {
        $cacheKey = MemberCardController::tokenCacheKey($token);
        $userId = Cache::get($cacheKey);

        if (! $userId) {
            throw ValidationException::withMessages([
                'identifier' => ['Token QR tidak valid atau sudah kedaluwarsa.'],
            ]);
        }

        $user = User::find($userId);

        if (! $user) {
            throw ValidationException::withMessages([
                'identifier' => ['Token QR tidak valid atau sudah kedaluwarsa.'],
            ]);
        }

        $this->assertValidMember($user);

        return $user;
    }

    /**
     * Validasi bahwa user adalah anggota aktif yang tidak diblokir.
     *
     * @throws ValidationException
     */
    private function assertValidMember(User $user): void
    {
        if ($user->role !== 'user') {
            throw ValidationException::withMessages([
                'identifier' => ['Identitas yang diberikan bukan milik anggota.'],
            ]);
        }

        if ($user->isBanned()) {
            throw ValidationException::withMessages([
                'identifier' => ['Akun member ini telah diblokir.'],
            ]);
        }
    }

    /**
     * Simpan setoran baru dalam satu transaksi database.
     *
     * Alur di dalam transaction:
     *   1. Lock baris user (lockForUpdate)
     *   2. Hitung poin per item = round(weight_kg × category.points_per_kg)
     *   3. Buat Deposit header + DepositItem per baris
     *   4. Kredit poin ke user + catat PointTransaction
     *
     * @param  WasteBank  $wasteBank  Bank sampah petugas
     * @param  User  $recorder  Petugas yang mencatat
     * @param  array{
     *           member_code: string,
     *           notes: ?string,
     *           items: list<array{waste_category_id: int, weight_kg: float}>
     *         }                        $data        Data tervalidasi dari FormRequest
     * @return Deposit Deposit yang sudah dimuat relasi
     *
     * @throws ValidationException
     */
    public function store(WasteBank $wasteBank, User $recorder, array $data): Deposit
    {
        // Ambil id kategori yang diterima bank ini
        $acceptedCategoryIds = $wasteBank
            ->acceptedCategories()
            ->pluck('waste_categories.id')
            ->toArray();

        // Validasi semua item — kategori harus ada di accepted list
        $categoryIds = array_column($data['items'], 'waste_category_id');
        $rejected = array_diff($categoryIds, $acceptedCategoryIds);

        if (! empty($rejected)) {
            throw ValidationException::withMessages([
                'items' => ['Beberapa kategori tidak diterima oleh bank sampah ini.'],
            ]);
        }

        // Muat categories sekaligus untuk mengambil points_per_kg
        $categories = WasteCategory::whereIn('id', $categoryIds)
            ->get()
            ->keyBy('id');

        $deposit = DB::transaction(function () use (
            $wasteBank, $recorder, $data, $categories
        ): Deposit {
            // 1. Kunci baris user untuk mencegah race condition saldo
            $identifier = $data['member_code'] ?? $data['member_token'];
            $isToken = ! isset($data['member_code']);

            if ($isToken) {
                // Resolusi token → user_id (di dalam transaksi agar atomik)
                $cacheKey = MemberCardController::tokenCacheKey($identifier);
                $userId = Cache::get($cacheKey);

                if (! $userId) {
                    throw ValidationException::withMessages([
                        'identifier' => ['Token QR tidak valid atau sudah kedaluwarsa.'],
                    ]);
                }

                $member = User::where('id', $userId)->lockForUpdate()->firstOrFail();
            } else {
                $member = User::where('member_code', strtoupper($identifier))
                    ->lockForUpdate()
                    ->firstOrFail();
            }

            if ($member->isBanned()) {
                throw ValidationException::withMessages([
                    'identifier' => ['Akun member ini telah diblokir.'],
                ]);
            }

            // 2. Hitung total berat & poin
            $totalWeight = 0;
            $totalPoints = 0;
            $itemsData = [];

            foreach ($data['items'] as $item) {
                $cat = $categories[$item['waste_category_id']];
                $points = (int) round($item['weight_kg'] * $cat->points_per_kg);

                $totalWeight += $item['weight_kg'];
                $totalPoints += $points;

                $itemsData[] = [
                    'waste_category_id' => $cat->id,
                    'weight_kg' => $item['weight_kg'],
                    'points' => $points,
                ];
            }

            // 3. Buat header deposit
            $deposit = Deposit::create([
                'waste_bank_id' => $wasteBank->id,
                'user_id' => $member->id,
                'recorded_by' => $recorder->id,
                'notes' => $data['notes'] ?? null,
                'total_weight_kg' => $totalWeight,
                'total_points' => $totalPoints,
            ]);

            // 4. Buat deposit items (bulk)
            $deposit->items()->createMany($itemsData);

            // 5. Kredit poin + ledger
            // Muat relasi wasteBank agar dipakai dalam description
            $deposit->load('wasteBank');
            $this->pointService->creditDeposit($member, $deposit, $totalPoints);

            // 6. Hanguskan token QR agar tidak dapat dipakai dua kali
            if ($isToken) {
                Cache::forget(MemberCardController::tokenCacheKey($identifier));
                Cache::forget(MemberCardController::userTokenPointerKey($member->id));
            }

            // Muat semua relasi yang diperlukan oleh DepositResource
            return $deposit->loadMissing([
                'items.wasteCategory',
                'depositor',
                'recorder',
            ]);
        });

        // Notifikasi dikirim SETELAH transaksi commit agar tidak hilang bila
        // transaksi dibatalkan karena exception.
        $depositor = $deposit->depositor;
        $depositor->notify(new DepositRecorded($deposit, $deposit->total_points));

        return $deposit;
    }
}
