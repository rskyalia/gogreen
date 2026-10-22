<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'avatar',
        'google_id',
        'member_code',
        'points_balance',
        'status',
        'banned_reason',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'points_balance' => 'integer',
        ];
    }

    // ── Boot: generate member_code otomatis untuk role user ───────────────

    protected static function booted(): void
    {
        static::creating(function (User $user) {
            if ($user->role === 'user' && empty($user->member_code)) {
                $user->member_code = static::generateUniqueMemberCode();
            }
        });
    }

    public static function generateUniqueMemberCode(): string
    {
        do {
            // Format: GG-XXXXXX  (huruf kapital + angka, 6 karakter)
            $code = 'GG-'.strtoupper(Str::random(6));
        } while (static::where('member_code', $code)->exists());

        return $code;
    }

    // ── Role helpers ──────────────────────────────────────────────────────

    public function isDeveloper(): bool
    {
        return $this->role === 'developer';
    }

    public function isWasteBank(): bool
    {
        return $this->role === 'waste_bank';
    }

    public function isCommunity(): bool
    {
        return $this->role === 'community';
    }

    public function isUser(): bool
    {
        return $this->role === 'user';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isBanned(): bool
    {
        return $this->status === 'banned';
    }

    // ── Relations ─────────────────────────────────────────────────────────

    public function wasteScans(): HasMany
    {
        return $this->hasMany(WasteScan::class);
    }

    public function wasteBank(): HasOne
    {
        return $this->hasOne(WasteBank::class);
    }

    /** Deposit sebagai penyetor (warga) */
    public function deposits(): HasMany
    {
        return $this->hasMany(Deposit::class);
    }

    /** Deposit yang dicatat oleh user ini (sebagai petugas) */
    public function recordedDeposits(): HasMany
    {
        return $this->hasMany(Deposit::class, 'recorded_by');
    }

    public function pointTransactions(): HasMany
    {
        return $this->hasMany(PointTransaction::class);
    }

    public function diySubmissions(): HasMany
    {
        return $this->hasMany(DiySubmission::class);
    }

    /** Panduan DIY yang dibuat oleh user ini (community/developer) */
    public function diyGuides(): HasMany
    {
        return $this->hasMany(DiyGuide::class, 'created_by');
    }

    public function rewardRedemptions(): HasMany
    {
        return $this->hasMany(RewardRedemption::class);
    }

    /** Permintaan material (hanya community) */
    public function materialRequests(): HasMany
    {
        return $this->hasMany(MaterialRequest::class, 'community_id');
    }

    /** Respons terhadap permintaan material */
    public function materialRequestResponses(): HasMany
    {
        return $this->hasMany(MaterialRequestResponse::class, 'responder_id');
    }
}
