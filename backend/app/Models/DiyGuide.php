<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DiyGuide extends Model
{
    use HasFactory;

    protected $fillable = [
        'creator_id',
        'title',
        'waste_category',
        'description',
        'difficulty',
        'points_reward',
        'image_path',
        'steps',
    ];

    protected $casts = [
        'steps' => 'array', // Konversi JSON ke Array otomatis
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }
}
