<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DiySubmission extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'diy_guide_id',
        'waste_scan_id',
        'proof_image',
        'status',
        'review_note',
        'reviewed_by',
        'reviewed_at',
        'points_awarded',
    ];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
            'points_awarded' => 'integer',
        ];
    }

    // ── Business Logic ─────────────────────────────────────────────────────
    //
    // Saat di-approve: poin = diy_guides.reward_points, otomatis masuk ke user
    // lewat point_transactions. Jika reject, wajib isi review_note.

    public function approve(User $reviewer): void
    {
        if ($this->status !== 'pending') {
            throw ValidationException::withMessages([
                'status' => ['Submission ini sudah diproses.'],
            ]);
        }

        DB::transaction(function () use ($reviewer) {
            $guide = $this->diyGuide;
            $user = $this->user;
            $points = $guide->reward_points;

            // Update submission
            $this->update([
                'status' => 'approved',
                'reviewed_by' => $reviewer->id,
                'reviewed_at' => now(),
                'points_awarded' => $points,
            ]);

            if ($points > 0) {
                // Tambah saldo user
                $newBalance = $user->points_balance + $points;
                $user->update(['points_balance' => $newBalance]);

                // Catat di ledger
                PointTransaction::create([
                    'user_id' => $user->id,
                    'type' => 'diy_approved',
                    'points' => $points,
                    'balance_after' => $newBalance,
                    'reference_type' => self::class,
                    'reference_id' => $this->id,
                    'description' => "DIY selesai: {$guide->title}",
                ]);
            }
        });
    }

    public function reject(User $reviewer, string $reviewNote): void
    {
        if ($this->status !== 'pending') {
            throw ValidationException::withMessages([
                'status' => ['Submission ini sudah diproses.'],
            ]);
        }

        if (empty(trim($reviewNote))) {
            throw ValidationException::withMessages([
                'review_note' => ['Alasan penolakan wajib diisi.'],
            ]);
        }

        $this->update([
            'status' => 'rejected',
            'review_note' => $reviewNote,
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
        ]);
    }

    // ── Relations ─────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function diyGuide(): BelongsTo
    {
        return $this->belongsTo(DiyGuide::class);
    }

    public function wasteScan(): BelongsTo
    {
        return $this->belongsTo(WasteScan::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function pointTransactions(): MorphMany
    {
        return $this->morphMany(PointTransaction::class, 'reference');
    }
}
