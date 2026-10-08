<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiScanLog extends Model
{
    protected $fillable = [
        'waste_scan_id',
        'model_name',
        'confidence',
        'is_corrected',
        'corrected_label',
    ];

    protected function casts(): array
    {
        return [
            'confidence'   => 'decimal:4',
            'is_corrected' => 'boolean',
        ];
    }

    // ── Relations ─────────────────────────────────────────────────────────────

    public function wasteScan(): BelongsTo
    {
        return $this->belongsTo(WasteScan::class);
    }
}
