<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RewardRedemption extends Model
{
    protected $fillable = [
        'user_id',
        'reward_id',
        'points_spent',
        'status',
        'claim_note',
    ];

    protected function casts(): array
    {
        return [
            'points_spent' => 'integer',
        ];
    }

    // ── Business Logic ─────────────────────────────────────────────────────
    //
    // Validasi saldo & stok, kurangi poin lewat ledger.
    // Dipanggil dari RewardController — selalu dalam satu DB transaction.

    public static function redeem(User $user, Reward $reward): self
    {
        return DB::transaction(function () use ($user, $reward): self {
            // 1. Validasi saldo
            if ($user->points_balance < $reward->points_cost) {
                throw ValidationException::withMessages([
                    'points' => ['Saldo poin tidak mencukupi.'],
                ]);
            }

            // 2. Validasi stok (lock row untuk hindari race condition)
            $reward = Reward::lockForUpdate()->findOrFail($reward->id);
            if ($reward->stock !== null && $reward->stock <= 0) {
                throw ValidationException::withMessages([
                    'stock' => ['Stok reward sudah habis.'],
                ]);
            }

            // 3. Buat redemption record
            $redemption = self::create([
                'user_id'      => $user->id,
                'reward_id'    => $reward->id,
                'points_spent' => $reward->points_cost,
                'status'       => 'pending',
                'claim_note'   => $reward->claim_note ?? null,
            ]);

            // 4. Kurangi stok jika terbatas
            if ($reward->stock !== null) {
                $reward->decrement('stock');
            }

            // 5. Kurangi poin user
            $newBalance = $user->points_balance - $reward->points_cost;
            $user->update(['points_balance' => $newBalance]);

            // 6. Catat di ledger (nilai negatif)
            PointTransaction::create([
                'user_id'        => $user->id,
                'type'           => 'redeem',
                'points'         => -$reward->points_cost,
                'balance_after'  => $newBalance,
                'reference_type' => self::class,
                'reference_id'   => $redemption->id,
                'description'    => "Penukaran reward: {$reward->name}",
            ]);

            return $redemption;
        });
    }

    // ── Relations ─────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reward(): BelongsTo
    {
        return $this->belongsTo(Reward::class);
    }

    public function pointTransactions(): MorphMany
    {
        return $this->morphMany(PointTransaction::class, 'reference');
    }
}
