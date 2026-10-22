<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Facades\DB;

class Deposit extends Model
{
    protected $fillable = [
        'waste_bank_id',
        'user_id',
        'recorded_by',
        'notes',
        'total_weight_kg',
        'total_points',
    ];

    protected function casts(): array
    {
        return [
            'total_weight_kg' => 'decimal:3',
            'total_points'    => 'integer',
        ];
    }

    // ── Business Logic ─────────────────────────────────────────────────────
    //
    // Saat deposit disimpan: hitung points per item (weight_kg × points_per_kg),
    // buat point_transaction, tambah users.points_balance — semua dalam satu DB transaction.
    // Dipanggil dari DepositController setelah deposit & items tersimpan.

    public static function processPoints(Deposit $deposit): void
    {
        DB::transaction(function () use ($deposit) {
            $user = $deposit->depositor;

            // Kalkulasi ulang total dari items (sebagai validasi)
            $totalPoints = $deposit->items->sum('points');

            // Update snapshot total di deposit
            $deposit->update(['total_points' => $totalPoints]);

            // Update saldo user
            $newBalance = $user->points_balance + $totalPoints;
            $user->update(['points_balance' => $newBalance]);

            // Catat di ledger
            PointTransaction::create([
                'user_id'        => $user->id,
                'type'           => 'deposit',
                'points'         => $totalPoints,
                'balance_after'  => $newBalance,
                'reference_type' => Deposit::class,
                'reference_id'   => $deposit->id,
                'description'    => "Penyetoran sampah di {$deposit->wasteBank->name}",
            ]);
        });
    }

    // ── Relations ─────────────────────────────────────────────────────────

    public function wasteBank(): BelongsTo
    {
        return $this->belongsTo(WasteBank::class);
    }

    /** Warga yang menyetor */
    public function depositor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** Petugas yang mencatat */
    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(DepositItem::class);
    }

    public function pointTransactions(): MorphMany
    {
        return $this->morphMany(PointTransaction::class, 'reference');
    }
}
