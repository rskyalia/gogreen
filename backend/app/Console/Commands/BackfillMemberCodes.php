<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\MemberCodeService;
use Illuminate\Console\Command;

/**
 * members:backfill-codes
 *
 * Mengisi member_code untuk user role=user yang masih kosong.
 * Aman dijalankan berulang — user yang sudah punya member_code tidak diubah.
 */
class BackfillMemberCodes extends Command
{
    protected $signature = 'members:backfill-codes';

    protected $description = 'Isi member_code untuk user lama yang belum memiliki kode.';

    public function handle(MemberCodeService $service): int
    {
        $users = User::where('role', 'user')
            ->where(function ($q): void {
                $q->whereNull('member_code')->orWhere('member_code', '');
            })
            ->get();

        if ($users->isEmpty()) {
            $this->info('Semua user role=user sudah memiliki member_code. Tidak ada yang perlu diisi.');

            return self::SUCCESS;
        }

        $filled = 0;

        foreach ($users as $user) {
            $user->member_code = $service->generate($user);
            $user->saveQuietly();
            $filled++;
        }

        $this->info("Berhasil mengisi {$filled} member_code.");

        return self::SUCCESS;
    }
}
