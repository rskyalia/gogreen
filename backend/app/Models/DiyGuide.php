<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DiyGuide extends Model
{
    protected $fillable = [
        'waste_category_id',
        'created_by',
        'title',
        'description',
        'difficulty',
        'estimated_minutes',
        'estimated_cost',
        'materials',
        'steps',
        'cover_image',
        'video_url',
        'reward_points',
        'is_published',
    ];

    protected function casts(): array
    {
        return [
            'materials'         => 'array',
            'steps'             => 'array',
            'estimated_minutes' => 'integer',
            'estimated_cost'    => 'integer',
            'reward_points'     => 'integer',
            'is_published'      => 'boolean',
        ];
    }

    // ── Scopes ────────────────────────────────────────────────────────────

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    // ── Relations ─────────────────────────────────────────────────────────

    public function wasteCategory(): BelongsTo
    {
        return $this->belongsTo(WasteCategory::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(DiySubmission::class);
    }
}
