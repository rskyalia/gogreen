<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaterialRequestResponse extends Model
{
    protected $fillable = [
        'material_request_id',
        'responder_id',
        'quantity_offered_kg',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity_offered_kg' => 'decimal:2',
        ];
    }

    // ── Relations ─────────────────────────────────────────────────────────

    public function materialRequest(): BelongsTo
    {
        return $this->belongsTo(MaterialRequest::class);
    }

    public function responder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responder_id');
    }
}
