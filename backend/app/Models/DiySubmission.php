<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DiySubmission extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'diy_guide_id',
        'proof_image',
        'notes',
        'status',
        'validated_by',
        'rejection_reason',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function diyGuide()
    {
        return $this->belongsTo(DiyGuide::class);
    }
}
