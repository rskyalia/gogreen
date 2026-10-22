<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WasteCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_recyclable',
        'is_upcyclable',
        'points_per_kg',
        'icon',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_recyclable' => 'boolean',
            'is_upcyclable' => 'boolean',
            'points_per_kg' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    // ── Scopes ────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // ── Relations ─────────────────────────────────────────────────────────

    public function wasteScans(): HasMany
    {
        return $this->hasMany(WasteScan::class);
    }

    public function diyGuides(): HasMany
    {
        return $this->hasMany(DiyGuide::class);
    }

    public function wasteBanks(): BelongsToMany
    {
        return $this->belongsToMany(WasteBank::class, 'waste_bank_categories');
    }

    public function depositItems(): HasMany
    {
        return $this->hasMany(DepositItem::class);
    }

    public function materialRequests(): HasMany
    {
        return $this->hasMany(MaterialRequest::class);
    }
}
