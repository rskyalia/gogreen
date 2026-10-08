<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Achievement extends Model
{
    protected $fillable = [
        'code',
        'name',
        'description',
        'icon',
        'criteria_type',
        'criteria_value',
    ];

    protected function casts(): array
    {
        return [
            'criteria_value' => 'integer',
        ];
    }

    // ── Relations ─────────────────────────────────────────────────────────────

    public function userAchievements(): HasMany
    {
        return $this->hasMany(UserAchievement::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_achievements')
            ->withPivot('unlocked_at');
    }
}
