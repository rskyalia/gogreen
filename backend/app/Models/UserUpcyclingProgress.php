<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class UserUpcyclingProgress extends Model
{
    protected $table = 'user_upcycling_progress';

    protected $fillable = [
        'user_id',
        'upcycling_idea_id',
        'waste_scan_id',
        'status',
        'proof_image',
        'points_awarded',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'completed_at'  => 'datetime',
            'points_awarded' => 'integer',
        ];
    }

    // ── Relations ─────────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function upcyclingIdea(): BelongsTo
    {
        return $this->belongsTo(UpcyclingIdea::class);
    }

    public function wasteScan(): BelongsTo
    {
        return $this->belongsTo(WasteScan::class);
    }

    public function pointTransactions(): MorphMany
    {
        return $this->morphMany(PointTransaction::class, 'reference');
    }
}
