<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DraftDeposit extends Model
{
    protected $fillable = [
        'user_id',
        'waste_bank_id',
        'qr_token',
        'status',
        'notes',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
        ];
    }

    // ── Relations ─────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function wasteBank(): BelongsTo
    {
        return $this->belongsTo(WasteBank::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(DraftDepositItem::class);
    }

    // ── Scopes ────────────────────────────────────────────────────────────

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeNotExpired($query)
    {
        return $query->where('expires_at', '>', now());
    }

    // ── Status Helpers ────────────────────────────────────────────────────

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isExpired(): bool
    {
        return $this->expires_at && now()->gt($this->expires_at);
    }

    public function markApproved(): void
    {
        $this->update(['status' => 'approved']);
    }

    public function markRejected(): void
    {
        $this->update(['status' => 'rejected']);
    }

    public function markExpired(): void
    {
        $this->update(['status' => 'expired']);
    }
}
