<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class PointTransaction extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'points',
        'balance_after',
        'reference_type',
        'reference_id',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'points'        => 'integer',
            'balance_after' => 'integer',
        ];
    }

    // ── Relations ─────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Polymorphic: Deposit | DiySubmission | RewardRedemption */
    public function reference(): MorphTo
    {
        return $this->morphTo();
    }
}
