<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Reward extends Model
{
    protected $fillable = [
        'name',
        'description',
        'image',
        'points_cost',
        'stock',
        'is_active',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'points_cost' => 'integer',
            'stock'       => 'integer',
            'is_active'   => 'boolean',
        ];
    }

    // ── Scopes ────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeAvailable($query)
    {
        return $query->active()
            ->where(fn ($q) => $q->whereNull('stock')->orWhere('stock', '>', 0));
    }

    // ── Relations ─────────────────────────────────────────────────────────

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(RewardRedemption::class);
    }
}
