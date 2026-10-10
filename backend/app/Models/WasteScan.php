<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class WasteScan extends Model
{
    protected $fillable = [
        'user_id',
        'waste_category_id',
        'image_path',
        'object_name',
        'material',
        'confidence',
        'green_score',
        'recommended_path',
        'raw_result',
    ];

    protected function casts(): array
    {
        return [
            'confidence'  => 'decimal:2',
            'green_score' => 'integer',
            'raw_result'  => 'array',
        ];
    }

    // ── Relations ─────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function wasteCategory(): BelongsTo
    {
        return $this->belongsTo(WasteCategory::class);
    }

    public function mlApiLog(): HasOne
    {
        return $this->hasOne(MlApiLog::class);
    }

    public function diySubmissions(): MorphMany
    {
        return $this->morphMany(DiySubmission::class, 'reference');
    }
}
