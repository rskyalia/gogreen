<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WasteCategory extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_recyclable',
        'is_upcyclable',
        'points_per_kg',
        'icon',
    ];

    protected function casts(): array
    {
        return [
            'is_recyclable'  => 'boolean',
            'is_upcyclable'  => 'boolean',
            'points_per_kg'  => 'integer',
        ];
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
