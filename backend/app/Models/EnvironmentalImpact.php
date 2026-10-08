<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EnvironmentalImpact extends Model
{
    protected $fillable = [
        'user_id',
        'waste_diverted_kg',
        'items_reused',
        'waste_deposited_kg',
        'total_scans',
    ];

    protected function casts(): array
    {
        return [
            'waste_diverted_kg'  => 'decimal:3',
            'waste_deposited_kg' => 'decimal:3',
            'items_reused'       => 'integer',
            'total_scans'        => 'integer',
        ];
    }

    // ── Relations ─────────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Increment a given metric for a user, creating the record if it doesn't exist.
     */
    public static function increment(int $userId, string $column, float $amount = 1): void
    {
        static::firstOrCreate(['user_id' => $userId])->increment($column, $amount);
    }
}
