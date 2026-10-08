<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class WasteBank extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'name',
        'address',
        'latitude',
        'longitude',
        'phone',
        'operating_hours',
        'description',
        'is_active',
        'is_verified',
    ];

    protected function casts(): array
    {
        return [
            'operating_hours' => 'array',
            'is_active'       => 'boolean',
            'is_verified'     => 'boolean',
            'latitude'        => 'decimal:7',
            'longitude'       => 'decimal:7',
        ];
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // ── Relations ─────────────────────────────────────────────────────────────

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function acceptedCategories(): BelongsToMany
    {
        return $this->belongsToMany(WasteCategory::class, 'waste_bank_accepted_categories')
            ->withPivot('price_per_kg');
    }

    public function deposits(): HasMany
    {
        return $this->hasMany(Deposit::class);
    }
}
