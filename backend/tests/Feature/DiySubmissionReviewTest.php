<?php

namespace Tests\Feature;

use App\Models\DiyGuide;
use App\Models\DiySubmission;
use App\Models\PointTransaction;
use App\Models\User;
use App\Models\WasteCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Tes fitur review karya DIY:
 * - Review ganda tidak menambah poin dua kali
 * - Reject tanpa catatan ditolak
 */
class DiySubmissionReviewTest extends TestCase
{
    use RefreshDatabase;

    private function makeSubmission(int $rewardPoints = 30): DiySubmission
    {
        $category = WasteCategory::factory()->create();

        $guide = DiyGuide::factory()->create([
            'waste_category_id' => $category->id,
            'reward_points' => $rewardPoints,
        ]);

        $submitter = User::factory()->create(['points_balance' => 0]);

        return DiySubmission::factory()->create([
            'user_id' => $submitter->id,
            'diy_guide_id' => $guide->id,
            'status' => 'pending',
        ]);
    }

    #[Test]
    public function developer_can_approve_pending_submission(): void
    {
        $developer = User::factory()->developer()->create();
        $submission = $this->makeSubmission(30);

        Sanctum::actingAs($developer);

        $this->patchJson("/api/admin/diy-submissions/{$submission->id}/review", [
            'status' => 'approved',
        ])->assertStatus(200)
            ->assertJsonPath('data.status', 'approved');

        $this->assertDatabaseHas('diy_submissions', [
            'id' => $submission->id,
            'status' => 'approved',
            'points_awarded' => 30,
            'reviewed_by' => $developer->id,
        ]);

        $this->assertEquals(30, $submission->user->fresh()->points_balance);
    }

    #[Test]
    public function approving_twice_does_not_double_points(): void
    {
        $developer = User::factory()->developer()->create();
        $submission = $this->makeSubmission(30);

        Sanctum::actingAs($developer);

        // Approval pertama — harus berhasil
        $this->patchJson("/api/admin/diy-submissions/{$submission->id}/review", [
            'status' => 'approved',
        ])->assertStatus(200);

        // Approval kedua — harus ditolak karena sudah diproses
        $this->patchJson("/api/admin/diy-submissions/{$submission->id}/review", [
            'status' => 'approved',
        ])->assertStatus(422)
            ->assertJsonPath('errors.status.0', fn ($v) => ! empty($v));

        // Poin tetap 30, bukan 60
        $this->assertEquals(30, $submission->user->fresh()->points_balance);

        // Hanya ada 1 point_transaction bertipe diy_approved
        $this->assertEquals(1, PointTransaction::where('user_id', $submission->user_id)
            ->where('type', 'diy_approved')
            ->count());
    }

    #[Test]
    public function reject_without_review_note_fails(): void
    {
        $developer = User::factory()->developer()->create();
        $submission = $this->makeSubmission();

        Sanctum::actingAs($developer);

        $this->patchJson("/api/admin/diy-submissions/{$submission->id}/review", [
            'status' => 'rejected',
            // review_note sengaja tidak dikirim
        ])->assertStatus(422)
            ->assertJsonPath('errors.review_note.0', fn ($v) => ! empty($v));

        // Status tidak berubah
        $this->assertDatabaseHas('diy_submissions', [
            'id' => $submission->id,
            'status' => 'pending',
        ]);
    }

    #[Test]
    public function reject_with_note_succeeds(): void
    {
        $developer = User::factory()->developer()->create();
        $submission = $this->makeSubmission();

        Sanctum::actingAs($developer);

        $this->patchJson("/api/admin/diy-submissions/{$submission->id}/review", [
            'status' => 'rejected',
            'review_note' => 'Foto bukti tidak jelas.',
        ])->assertStatus(200)
            ->assertJsonPath('data.status', 'rejected');

        $this->assertEquals(0, $submission->user->fresh()->points_balance);
    }

    #[Test]
    public function non_developer_cannot_review(): void
    {
        $user = User::factory()->create();
        $submission = $this->makeSubmission();

        Sanctum::actingAs($user);

        $this->patchJson("/api/admin/diy-submissions/{$submission->id}/review", [
            'status' => 'approved',
        ])->assertStatus(403);
    }
}
