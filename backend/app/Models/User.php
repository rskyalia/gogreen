<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
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
        'total_points',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'is_active'         => 'boolean',
            'total_points'      => 'integer',
        ];
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isWasteBank(): bool
    {
        return $this->role === 'waste_bank';
    }

    public function isCitizen(): bool
    {
        return $this->role === 'citizen';
    }

    // ── Relations ─────────────────────────────────────────────────────────────

    public function wasteScans(): HasMany
    {
        return $this->hasMany(WasteScan::class);
    }

    public function upcyclingProgress(): HasMany
    {
        return $this->hasMany(UserUpcyclingProgress::class);
    }

    public function wasteBank(): HasOne
    {
        return $this->hasOne(WasteBank::class);
    }

    public function deposits(): HasMany
    {
        return $this->hasMany(Deposit::class);
    }

    public function pointTransactions(): HasMany
    {
        return $this->hasMany(PointTransaction::class);
    }

    public function userAchievements(): HasMany
    {
        return $this->hasMany(UserAchievement::class);
    }

    public function achievements(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Achievement::class, 'user_achievements')
            ->withPivot('unlocked_at')
            ->withTimestamps();
    }

    public function environmentalImpact(): HasOne
    {
        return $this->hasOne(EnvironmentalImpact::class);
    }
}
