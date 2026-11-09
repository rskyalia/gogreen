<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DraftDepositItem extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'draft_deposit_id',
        'waste_category_id',
        'weight_kg',
    ];

    protected function casts(): array
    {
        return [
            'weight_kg' => 'decimal:2',
        ];
    }

    // ── Relations ─────────────────────────────────────────────────────────

    public function draftDeposit(): BelongsTo
    {
        return $this->belongsTo(DraftDeposit::class);
    }

    public function wasteCategory(): BelongsTo
    {
        return $this->belongsTo(WasteCategory::class);
    }
}
