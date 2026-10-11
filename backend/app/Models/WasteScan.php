<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WasteScan extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'image_path',
        'detected_category',
        'waste_type',
        'confidence_score',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
