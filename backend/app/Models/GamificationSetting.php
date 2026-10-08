<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GamificationSetting extends Model
{
    protected $fillable = [
        'action_type',
        'points',
        'daily_limit',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'points'      => 'integer',
            'daily_limit' => 'integer',
            'is_active'   => 'boolean',
        ];
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Get active points for a given action type.
     */
    public static function pointsFor(string $actionType): int
    {
        $setting = static::where('action_type', $actionType)
            ->where('is_active', true)
            ->first();

        return $setting?->points ?? 0;
    }
}
