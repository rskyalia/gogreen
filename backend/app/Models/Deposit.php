<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Deposit extends Model
{
    protected $fillable = [
        'user_id',
        'waste_bank_id',
        'waste_category_id',
        'estimated_weight_kg',
        'verified_weight_kg',
        'status',
        'notes',
        'proof_image',
        'verified_by',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'estimated_weight_kg' => 'decimal:3',
            'verified_weight_kg'  => 'decimal:3',
            'verified_at'         => 'datetime',
        ];
    }

    // ── Relations ─────────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function wasteBank(): BelongsTo
    {
        return $this->belongsTo(WasteBank::class);
    }

    public function wasteCategory(): BelongsTo
    {
        return $this->belongsTo(WasteCategory::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function pointTransactions(): MorphMany
    {
        return $this->morphMany(PointTransaction::class, 'reference');
    }
}
