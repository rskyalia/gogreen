<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DepositItem extends Model
{
    // Tidak perlu timestamps — item tidak diupdate setelah disimpan
    public $timestamps = false;

    protected $fillable = [
        'deposit_id',
        'waste_category_id',
        'weight_kg',
        'points',
    ];

    protected function casts(): array
    {
        return [
            'weight_kg' => 'decimal:2',
            'points'    => 'integer',
        ];
    }

    // ── Relations ─────────────────────────────────────────────────────────

    public function deposit(): BelongsTo
    {
        return $this->belongsTo(Deposit::class);
    }

    public function wasteCategory(): BelongsTo
    {
        return $this->belongsTo(WasteCategory::class);
    }
}
