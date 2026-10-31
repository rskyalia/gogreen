<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\User;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * QrTokenService
 *
 * Siklus hidup token QR sekali pakai:
 *   active  → dibuat user, belum dipindai, TTL 5 menit
 *   claimed → sudah dipindai satu bank sampah, TTL 15 menit
 *   used    → setoran berhasil, token hangus
 *   expired → melewati TTL (key hilang dari cache)
 *
 * Data disimpan pada cache store bersama (database/redis), bukan array/file
 * lokal, agar konsisten ketika aplikasi berjalan di lebih dari satu proses.
 *
 *   qr:{token}       → { user_id, status, waste_bank_id?, expires_at }
 *   qr_user:{userId} → token aktif milik user
 *   qr_used:{token}  → ringkasan setoran (disimpan 10 menit setelah used)
 *   qr_lock:{token}  → lock klaim token
 */
class QrTokenService
{
    public const TTL_ACTIVE_SEC = 5 * 60;   // 5 menit

    public const TTL_CLAIMED_SEC = 15 * 60; // 15 menit

    public const TTL_USED_SEC = 10 * 60;    // 10 menit (qr_used)

    // ── Key helpers ───────────────────────────────────────────────────────

    public static function tokenKey(string $token): string
    {
        return 'qr:'.$token;
    }

    public static function userKey(int $userId): string
    {
        return 'qr_user:'.$userId;
    }

    public static function usedKey(string $token): string
    {
        return 'qr_used:'.$token;
    }

    public static function lockKey(string $token): string
    {
        return 'qr_lock:'.$token;
    }

    public static function userLockKey(int $userId): string
    {
        return 'qr_user_lock:'.$userId;
    }

    // ── Payload ───────────────────────────────────────────────────────────

    public static function buildPayload(string $token): string
    {
        return 'gogreen://member/'.$token;
    }

    // ── Buat token baru ───────────────────────────────────────────────────

    /**
     * Buat token baru untuk user. Token lama milik user yang sama dibatalkan.
     *
     * Catatan: untuk mencegah penimpaan token yang sedang diklaim bank sampah,
     * gunakan issue() sebagai gantinya.
     *
     * @return array{token: string, payload: string, expires_at: string}
     */
    public function generate(int $userId): array
    {
        $lock = Cache::lock(self::userLockKey($userId), 10);

        try {
            $lock->block(3);

            $this->revokeExistingForUser($userId);

            return $this->createToken($userId);
        } catch (LockTimeoutException) {
            // Sangat jarang; tetap beri token baru tanpa membatalkan proses lain.
            $this->revokeExistingForUser($userId);

            return $this->createToken($userId);
        } finally {
            $lock->release();
        }
    }

    // ── Buat token baru (issue) — tolak bila ada klaim aktif ───────────────

    /**
     * Buat token baru untuk user.
     *
     * Jika user punya token berstatus claimed, JANGAN timpa — lempar
     * token_in_process (409). Jika token lama masih active, hapus lalu buat baru.
     *
     * @return array{token: string, payload: string, expires_at: string}
     *
     * @throws ApiException token_in_process bila user memiliki token berstatus claimed
     */
    public function issue(User $user): array
    {
        $userId = $user->id;
        $lock = Cache::lock(self::userLockKey($userId), 10);

        try {
            $lock->block(3);

            $this->assertNoActiveClaim($userId);

            $this->revokeExistingForUser($userId);

            return $this->createToken($userId);
        } catch (LockTimeoutException) {
            // Sangat jarang; tetap periksa claimed lalu buat token baru.
            $this->assertNoActiveClaim($userId);

            $this->revokeExistingForUser($userId);

            return $this->createToken($userId);
        } finally {
            $lock->release();
        }
    }

    /**
     * Pastikan user tidak memiliki token berstatus claimed.
     *
     * @throws ApiException token_in_process
     */
    private function assertNoActiveClaim(int $userId): void
    {
        $oldToken = Cache::get(self::userKey($userId));

        if (! is_string($oldToken) || $oldToken === '') {
            return;
        }

        $payload = $this->get($oldToken);

        if ($payload && ($payload['status'] ?? null) === 'claimed') {
            throw ApiException::make(
                'token_in_process',
                'Token QR sedang digunakan untuk setoran. Tunggu hingga selesai.',
                409,
            );
        }
    }

    /**
     * Buat token aktif baru dan simpan pointer user. Tidak melakukan revoke.
     *
     * @return array{token: string, payload: string, expires_at: string}
     */
    private function createToken(int $userId): array
    {
        $token = Str::random(32);
        $expiresAt = now()->addSeconds(self::TTL_ACTIVE_SEC);

        Cache::put(
            self::tokenKey($token),
            [
                'user_id' => $userId,
                'status' => 'active',
                'expires_at' => $expiresAt->toIso8601String(),
            ],
            self::TTL_ACTIVE_SEC,
        );

        Cache::put(self::userKey($userId), $token, self::TTL_ACTIVE_SEC);

        return [
            'token' => $token,
            'payload' => self::buildPayload($token),
            'expires_at' => $expiresAt->toIso8601String(),
        ];
    }

    // ── Inspect: ambil data token atau lempar ─────────────────────────────

    /**
     * Kembalikan data token, atau lempar token_expired/token_invalid.
     *
     * @return array{user_id: int, status: string, waste_bank_id?: int, expires_at?: string}
     *
     * @throws ApiException token_expired bila token tidak ditemukan di cache
     */
    public function inspect(string $token): array
    {
        if ($this->isUsed($token)) {
            throw ApiException::make('token_used', 'Token QR sudah pernah digunakan.', 409);
        }

        $payload = $this->get($token);

        if (! $payload) {
            throw ApiException::make('token_expired', 'Token QR telah kedaluwarsa.', 422);
        }

        return $payload;
    }

    // ── Ambil payload token ───────────────────────────────────────────────

    /**
     * @return array{user_id: int, status: string, waste_bank_id?: int, expires_at?: string}|null
     */
    public function get(string $token): ?array
    {
        return Cache::get(self::tokenKey($token));
    }

    // ── Status token ──────────────────────────────────────────────────────

    /**
     * Kembalikan status token: 'active'|'claimed'|'used'|'expired'.
     *
     * @return array{status: string, waste_bank_id?: int, expires_at?: string}
     */
    public function status(string $token): array
    {
        if ($this->isUsed($token)) {
            return ['status' => 'used'];
        }

        $payload = $this->get($token);

        if (! $payload) {
            return ['status' => 'expired'];
        }

        return array_filter([
            'status' => $payload['status'],
            'waste_bank_id' => $payload['waste_bank_id'] ?? null,
            'expires_at' => $payload['expires_at'] ?? null,
        ], fn ($value) => $value !== null);
    }

    // ── Klaim (atomic) ────────────────────────────────────────────────────

    /**
     * Tandai token sebagai claimed oleh $wasteBankId.
     *
     * Lock non-blocking dipakai agar dua petugas yang memindai bersamaan tidak
     * sama-sama berhasil mengklaim token.
     *
     * @return array{
     *   success: bool,
     *   code?: string,
     *   payload?: array{user_id: int, status: string, waste_bank_id?: int, expires_at?: string}
     * }
     */
    public function claim(string $token, int $wasteBankId): array
    {
        $lock = Cache::lock(self::lockKey($token), 10);

        if (! $lock->get()) {
            return ['success' => false, 'code' => 'token_claimed_by_other'];
        }

        try {
            // Token yang sudah used harus dilaporkan sebagai used, bukan expired.
            if ($this->isUsed($token)) {
                return ['success' => false, 'code' => 'token_used'];
            }

            $payload = $this->get($token);

            if (! $payload) {
                return ['success' => false, 'code' => 'token_expired'];
            }

            if (($payload['status'] ?? null) === 'used') {
                return ['success' => false, 'code' => 'token_used'];
            }

            if (($payload['status'] ?? null) === 'claimed') {
                if (($payload['waste_bank_id'] ?? null) === $wasteBankId) {
                    // Bank yang sama boleh melakukan lookup ulang.
                    return ['success' => true, 'payload' => $payload];
                }

                return ['success' => false, 'code' => 'token_claimed_by_other'];
            }

            if (($payload['status'] ?? null) !== 'active') {
                return ['success' => false, 'code' => 'token_invalid'];
            }

            $expiresAt = now()->addSeconds(self::TTL_CLAIMED_SEC);

            $newPayload = [
                'user_id' => $payload['user_id'],
                'status' => 'claimed',
                'waste_bank_id' => $wasteBankId,
                'expires_at' => $expiresAt->toIso8601String(),
            ];

            Cache::put(self::tokenKey($token), $newPayload, self::TTL_CLAIMED_SEC);

            return ['success' => true, 'payload' => $newPayload];
        } finally {
            $lock->release();
        }
    }

    // ── Lepaskan klaim (release) — kembalikan ke active ────────────────────

    /**
     * Lepaskan klaim token: claimed → active kembali.
     *
     * Hanya bank sampah pemegang klaim yang boleh melepaskan.
     * TTL dikembalikan ke maksimal 5 menit dari sekarang.
     *
     * @return array{success: bool, code?: string}
     */
    public function release(string $token, int $wasteBankId): array
    {
        if ($this->isUsed($token)) {
            return ['success' => false, 'code' => 'token_used'];
        }

        $lock = Cache::lock(self::lockKey($token), 10);

        if (! $lock->get()) {
            return ['success' => false, 'code' => 'token_claimed_by_other'];
        }

        try {
            $payload = $this->get($token);

            if (! $payload) {
                return ['success' => false, 'code' => 'token_expired'];
            }

            if (($payload['status'] ?? null) !== 'claimed') {
                return ['success' => false, 'code' => 'token_invalid'];
            }

            if ((int) ($payload['waste_bank_id'] ?? 0) !== $wasteBankId) {
                return ['success' => false, 'code' => 'token_claimed_by_other'];
            }

            $expiresAt = now()->addSeconds(self::TTL_ACTIVE_SEC);

            Cache::put(self::tokenKey($token), [
                'user_id' => $payload['user_id'],
                'status' => 'active',
                'expires_at' => $expiresAt->toIso8601String(),
            ], self::TTL_ACTIVE_SEC);

            // Perbarui pointer user agar TTL sinkron
            Cache::put(self::userKey((int) $payload['user_id']), $token, self::TTL_ACTIVE_SEC);

            return ['success' => true];
        } finally {
            $lock->release();
        }
    }

    // ── Status untuk polling user ──────────────────────────────────────────

    /**
     * Status token milik user tertentu (untuk polling sisi user).
     *
     * Token milik user lain → lempar token_invalid agar tidak membocorkan
     * keberadaan token tersebut (404 di controller).
     *
     * @return array{status: string, waste_bank_id?: int, expires_at?: string}
     *
     * @throws ApiException token_invalid bila token bukan milik user
     */
    public function statusFor(string $token, User $user): array
    {
        $statusInfo = $this->status($token);
        $status = $statusInfo['status'];

        // Untuk status aktif/claimed, verifikasi kepemilikan via payload.
        if (in_array($status, ['active', 'claimed'], true)) {
            $payload = $this->get($token);

            if (! $payload || (int) $payload['user_id'] !== (int) $user->id) {
                throw ApiException::make('token_invalid', 'Token QR tidak ditemukan.', 404);
            }
        }

        // Untuk status used, verifikasi via qr_used summary.
        if ($status === 'used') {
            $summary = $this->getUsedSummary($token);

            if (! $summary || (int) ($summary['user_id'] ?? 0) !== (int) $user->id) {
                throw ApiException::make('token_invalid', 'Token QR tidak ditemukan.', 404);
            }
        }

        return $statusInfo;
    }

    // ── Hanguskan (used) ──────────────────────────────────────────────────

    /**
     * Tandai token sebagai used setelah setoran berhasil.
     * Simpan ringkasan di qr_used untuk polling layar user.
     *
     * Dipanggil di dalam DB::afterCommit agar hanya berjalan setelah commit.
     */
    public function markUsed(string $token, int $depositId): void
    {
        $payload = $this->get($token);

        $userId = $payload['user_id'] ?? null;

        if ($userId !== null) {
            $pointer = Cache::get(self::userKey((int) $userId));

            if ($pointer === $token) {
                Cache::forget(self::userKey((int) $userId));
            }
        }

        Cache::forget(self::tokenKey($token));
        Cache::put(self::usedKey($token), [
            'user_id' => $userId,
            'deposit_id' => $depositId,
        ], self::TTL_USED_SEC);
    }

    /**
     * Hanguskan token setelah setoran berhasil, lengkap dengan ringkasan.
     *
     * Dipakai oleh fitur setoran: pastikan token masih claimed oleh bank ini,
     * lalu set used dan simpan ringkasan setoran di qr_used.
     *
     * @param  array{deposit_id: int, waste_bank_name: string, total_weight_kg: float, total_points: int, balance_after: int}  $summary
     *
     * @throws ApiException bila token tidak claimed oleh bank ini
     */
    public function consume(string $token, int $wasteBankId, array $summary): void
    {
        $payload = $this->get($token);

        if (! $payload) {
            throw ApiException::make('token_expired', 'Token QR telah kedaluwarsa.', 422);
        }

        if (($payload['status'] ?? null) === 'used') {
            throw ApiException::make('token_used', 'Token QR sudah pernah digunakan.', 409);
        }

        if (($payload['status'] ?? null) !== 'claimed') {
            throw ApiException::make('token_invalid', 'Token QR belum dipindai oleh bank sampah ini.', 422);
        }

        if ((int) ($payload['waste_bank_id'] ?? 0) !== $wasteBankId) {
            throw ApiException::make('token_claimed_by_other', 'Token QR sedang diproses oleh bank sampah lain.', 409);
        }

        $userId = $payload['user_id'];

        $pointer = Cache::get(self::userKey((int) $userId));

        if ($pointer === $token) {
            Cache::forget(self::userKey((int) $userId));
        }

        Cache::forget(self::tokenKey($token));
        Cache::put(self::usedKey($token), array_merge([
            'user_id' => $userId,
        ], $summary), self::TTL_USED_SEC);
    }

    // ── Ambil deposit_id dari used key ────────────────────────────────────

    public function getDepositId(string $token): ?int
    {
        $data = Cache::get(self::usedKey($token));

        if ($data === null) {
            return null;
        }

        // Backward compat: qr_used bisa berisi int (lama) atau array (baru).
        if (is_array($data)) {
            return isset($data['deposit_id']) ? (int) $data['deposit_id'] : null;
        }

        return (int) $data;
    }

    /**
     * Ambil ringkasan setoran dari qr_used (atau null bila tidak ada).
     *
     * @return array<string, mixed>|null
     */
    public function getUsedSummary(string $token): ?array
    {
        $data = Cache::get(self::usedKey($token));

        if ($data === null) {
            return null;
        }

        if (is_array($data)) {
            return $data;
        }

        // Format lama (int deposit_id) — bungkus jadi array minimal.
        return ['deposit_id' => (int) $data];
    }

    public function isUsed(string $token): bool
    {
        return Cache::has(self::usedKey($token));
    }

    // ── Batalkan token user ───────────────────────────────────────────────

    /**
     * Cabut token aktif milik user (jika ada), dengan lock pada token tersebut
     * agar tidak bertabrakan dengan proses klaim yang sedang berjalan.
     */
    public function revokeExistingForUser(int $userId): void
    {
        $oldToken = Cache::get(self::userKey($userId));

        if (! is_string($oldToken) || $oldToken === '') {
            return;
        }

        $lock = Cache::lock(self::lockKey($oldToken), 5);

        try {
            if (! $lock->get()) {
                return;
            }

            if (Cache::get(self::userKey($userId)) === $oldToken) {
                Cache::forget(self::tokenKey($oldToken));
                Cache::forget(self::userKey($userId));
            }
        } finally {
            $lock->release();
        }
    }
}
