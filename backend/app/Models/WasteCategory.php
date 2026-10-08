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
        'icon',
    ];

    protected function casts(): array
    {
        return [
            'is_recyclable' => 'boolean',
        ];
    }

    // ── Relations ─────────────────────────────────────────────────────────────

    public function wasteScans(): HasMany
    {
        return $this->hasMany(WasteScan::class);
    }

    public function upcyclingIdeas(): HasMany
    {
        return $this->hasMany(UpcyclingIdea::class);
    }

    public function wasteBanks(): BelongsToMany
    {
        return $this->belongsToMany(WasteBank::class, 'waste_bank_accepted_categories')
            ->withPivot('price_per_kg');
    }

    public function deposits(): HasMany
    {
        return $this->hasMany(Deposit::class);
    }
}
