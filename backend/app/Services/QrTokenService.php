<?php

namespace App\Services;

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
 *   qr_used:{token}  → deposit_id (disimpan 10 menit setelah used)
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
     * @return array{token: string, payload: string, expires_at: string}
     */
    public function generate(int $userId): array
    {
        $lock = Cache::lock(self::userLockKey($userId), 10);

        try {
            $lock->block(3);

            $this->revokeExistingForUser($userId);

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
        } catch (LockTimeoutException) {
            // Sangat jarang; tetap beri token baru tanpa membatalkan proses lain.
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
        } finally {
            $lock->release();
        }
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

    // ── Hanguskan (used) ──────────────────────────────────────────────────

    /**
     * Tandai token sebagai used setelah setoran berhasil.
     * Simpan deposit_id di qr_used untuk polling layar user.
     *
     * Dipanggil di dalam DB::afterCommit agar hanya berjalan setelah commit.
     */
    public function markUsed(string $token, int $depositId): void
    {
        $payload = $this->get($token);

        if ($payload && isset($payload['user_id'])) {
            $pointer = Cache::get(self::userKey((int) $payload['user_id']));

            if ($pointer === $token) {
                Cache::forget(self::userKey((int) $payload['user_id']));
            }
        }

        Cache::forget(self::tokenKey($token));
        Cache::put(self::usedKey($token), $depositId, self::TTL_USED_SEC);
    }

    // ── Ambil deposit_id dari used key ────────────────────────────────────

    public function getDepositId(string $token): ?int
    {
        $id = Cache::get(self::usedKey($token));

        return $id !== null ? (int) $id : null;
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
