<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WasteBank extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'address',
        'latitude',
        'longitude',
        'phone',
        'description',
        'opening_hours',
        'is_open',
        'verification_status',
        'verified_by',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'opening_hours' => 'array',
            'is_open' => 'boolean',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'verified_at' => 'datetime',
        ];
    }

    // ── Scopes ────────────────────────────────────────────────────────────

    /** Hanya bank sampah yang sudah diverifikasi yang muncul di peta */
    public function scopeVerified($query)
    {
        return $query->where('verification_status', 'verified');
    }

    // ── Relations ─────────────────────────────────────────────────────────

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function acceptedCategories(): BelongsToMany
    {
        return $this->belongsToMany(WasteCategory::class, 'waste_bank_categories');
    }

    public function deposits(): HasMany
    {
        return $this->hasMany(Deposit::class);
    }
}
