<?php

namespace App\Notifications;

use App\Models\Deposit;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Notifikasi yang dikirim ke member (role=user) setelah setoran berhasil dicatat.
 *
 * Hanya menggunakan channel "database" sehingga seluruh data tersimpan di
 * tabel notifications dan bisa diambil via API.
 */
class DepositRecorded extends Notification
{
    use Queueable;

    /**
     * @param  Deposit  $deposit  Setoran yang berhasil — relasi wasteBank & items harus sudah dimuat.
     * @param  int  $points  Total poin yang dikreditkan.
     */
    public function __construct(
        private readonly Deposit $deposit,
        private readonly int $points,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Payload JSON yang disimpan ke kolom data.
     *
     * @return array{
     *   deposit_id: int,
     *   waste_bank_name: string,
     *   total_kg: float,
     *   total_points: int,
     * }
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'deposit_id' => $this->deposit->id,
            'waste_bank_name' => $this->deposit->wasteBank->name,
            'total_kg' => (float) $this->deposit->total_weight_kg,
            'total_points' => $this->points,
        ];
    }
}
