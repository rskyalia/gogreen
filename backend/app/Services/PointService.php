<?php

namespace App\Services;

use App\Models\Deposit;
use App\Models\PointTransaction;
use App\Models\User;

/**
 * PointService
 *
 * Satu-satunya tempat yang boleh mengubah users.points_balance dan
 * membuat baris di point_transactions.
 * Semua operasi WAJIB dipanggil di dalam DB::transaction yang aktif.
 */
class PointService
{
    /**
     * Kredit poin dari setoran ke akun user.
     *
     * Dipanggil saat DB::transaction aktif dan baris user sudah dikunci
     * dengan lockForUpdate(). Tidak membuat transaksi baru.
     *
     * @param  User  $user  Penerima poin (baris sudah di-lock)
     * @param  Deposit  $deposit  Setoran referensi (relasi wasteBank harus sudah dimuat)
     * @param  int  $points  Jumlah poin yang dikreditkan
     */
    public function creditDeposit(User $user, Deposit $deposit, int $points): PointTransaction
    {
        // Tambah saldo di database
        $user->increment('points_balance', $points);

        // Refresh model agar points_balance mencerminkan nilai terkini dari DB,
        // bukan nilai sebelum increment (increment() tidak mengupdate atribut model).
        $user->refresh();

        // Catat ledger — hanya INSERT, tidak pernah diupdate atau dihapus
        return PointTransaction::create([
            'user_id' => $user->id,
            'type' => 'deposit',
            'points' => $points,
            'balance_after' => $user->points_balance,
            'reference_type' => Deposit::class,
            'reference_id' => $deposit->id,
            'description' => "Setoran sampah di {$deposit->wasteBank->name}",
        ]);
    }
}
