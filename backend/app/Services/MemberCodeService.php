<?php

namespace App\Services;

use App\Models\User;

/**
 * MemberCodeService
 *
 * Menghasilkan member_code untuk role=user.
 *
 * Format: "GG-" + id user zero-padded 6 digit (contoh: GG-000006).
 *
 * member_code adalah IDENTITAS, bukan kredensial — keamanan ada pada
 * token QR. Karena berbasis ID user, kode ini unik tanpa perlu cek tabrakan.
 */
class MemberCodeService
{
    public const PREFIX = 'GG-';

    public const PAD_LENGTH = 6;

    /**
     * Buat member_code berbasis ID user.
     */
    public function generate(User $user): string
    {
        return self::PREFIX.str_pad((string) $user->id, self::PAD_LENGTH, '0', STR_PAD_LEFT);
    }
}
