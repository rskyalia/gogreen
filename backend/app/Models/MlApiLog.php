<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MlApiLog extends Model
{
    // Hanya created_at, tidak ada updated_at
    const UPDATED_AT = null;

    protected $fillable = [
        'waste_scan_id',
        'model_name',
        'status',
        'response_time_ms',
        'confidence',
        'error_message',
    ];

    protected function casts(): array
    {
        return [
            'confidence'       => 'decimal:2',
            'response_time_ms' => 'integer',
            'created_at'       => 'datetime',
        ];
    }

    // ── Relations ─────────────────────────────────────────────────────────

    public function wasteScan(): BelongsTo
    {
        return $this->belongsTo(WasteScan::class);
    }
}
