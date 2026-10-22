<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MaterialRequest extends Model
{
    protected $fillable = [
        'community_id',
        'waste_category_id',
        'quantity_needed_kg',
        'notes',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'quantity_needed_kg' => 'decimal:2',
        ];
    }

    // ── Scopes ────────────────────────────────────────────────────────────

    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    // ── Relations ─────────────────────────────────────────────────────────

    public function community(): BelongsTo
    {
        return $this->belongsTo(User::class, 'community_id');
    }

    public function wasteCategory(): BelongsTo
    {
        return $this->belongsTo(WasteCategory::class);
    }

    public function responses(): HasMany
    {
        return $this->hasMany(MaterialRequestResponse::class);
    }
}
