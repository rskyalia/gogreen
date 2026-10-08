<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UpcyclingIdea extends Model
{
    protected $fillable = [
        'waste_category_id',
        'title',
        'description',
        'difficulty',
        'estimated_minutes',
        'estimated_cost',
        'additional_materials',
        'tutorial_steps',
        'video_url',
        'image',
        'impact_kg',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'additional_materials' => 'array',
            'tutorial_steps'       => 'array',
            'impact_kg'            => 'decimal:3',
            'is_active'            => 'boolean',
            'estimated_minutes'    => 'integer',
            'estimated_cost'       => 'integer',
        ];
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // ── Relations ─────────────────────────────────────────────────────────────

    public function wasteCategory(): BelongsTo
    {
        return $this->belongsTo(WasteCategory::class);
    }

    public function userProgress(): HasMany
    {
        return $this->hasMany(UserUpcyclingProgress::class);
    }
}
