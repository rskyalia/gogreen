<?php

namespace Database\Factories;

use App\Models\DiyGuide;
use App\Models\DiySubmission;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DiySubmission>
 */
class DiySubmissionFactory extends Factory
{
    protected $model = DiySubmission::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'diy_guide_id' => DiyGuide::factory(),
            'waste_scan_id' => null,
            'proof_image' => 'proof/placeholder.jpg',
            'status' => 'pending',
            'review_note' => null,
            'reviewed_by' => null,
            'reviewed_at' => null,
            'points_awarded' => 0,
        ];
    }

    public function approved(): static
    {
        return $this->state(fn () => [
            'status' => 'approved',
            'reviewed_by' => User::factory()->developer(),
            'reviewed_at' => now(),
            'points_awarded' => 30,
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn () => [
            'status' => 'rejected',
            'review_note' => 'Foto bukti tidak jelas.',
            'reviewed_by' => User::factory()->developer(),
            'reviewed_at' => now(),
        ]);
    }
}
