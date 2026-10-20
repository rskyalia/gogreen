<?php

namespace Tests\Feature;

use App\Models\PointTransaction;
use App\Models\Reward;
use App\Models\RewardRedemption;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Tes fitur pembatalan penukaran reward:
 * - Pembatalan mengembalikan poin tepat satu kali
 * - Transisi status tidak valid ditolak
 */
class RedemptionCancellationTest extends TestCase
{
    use RefreshDatabase;

    private function createRedemption(int $pointsCost = 100, ?int $stock = 5): array
    {
        $developer = User::factory()->developer()->create();
        $reward = Reward::factory()->create([
            'points_cost' => $pointsCost,
            'stock' => $stock,
            'is_active' => true,
            'created_by' => $developer->id,
        ]);

        $user = User::factory()->withPoints(0)->create();

        $redemption = RewardRedemption::create([
            'user_id' => $user->id,
            'reward_id' => $reward->id,
            'points_spent' => $pointsCost,
            'status' => 'pending',
        ]);

        return [$developer, $user, $reward, $redemption];
    }

    #[Test]
    public function cancelling_redemption_refunds_points_exactly_once(): void
    {
        [$developer, $user, $reward, $redemption] = $this->createRedemption(100);

        Sanctum::actingAs($developer);

        $this->patchJson("/api/admin/redemptions/{$redemption->id}", [
            'status' => 'cancelled',
        ])->assertStatus(200)
            ->assertJsonPath('data.status', 'cancelled');

        // Poin dikembalikan
        $this->assertEquals(100, $user->fresh()->points_balance);

        // Tepat satu PointTransaction tipe adjustment
        $this->assertEquals(1, PointTransaction::where('user_id', $user->id)
            ->where('type', 'adjustment')
            ->count());
    }

    #[Test]
    public function cancelling_redemption_restores_stock(): void
    {
        [$developer, $user, $reward, $redemption] = $this->createRedemption(50, 5);

        Sanctum::actingAs($developer);

        $stockBefore = $reward->fresh()->stock;

        $this->patchJson("/api/admin/redemptions/{$redemption->id}", [
            'status' => 'cancelled',
        ])->assertStatus(200);

        $this->assertEquals($stockBefore + 1, $reward->fresh()->stock);
    }

    #[Test]
    public function cancelling_unlimited_stock_reward_does_not_change_stock(): void
    {
        [$developer, $user, $reward, $redemption] = $this->createRedemption(50, null);

        Sanctum::actingAs($developer);

        $this->patchJson("/api/admin/redemptions/{$redemption->id}", [
            'status' => 'cancelled',
        ])->assertStatus(200);

        $this->assertNull($reward->fresh()->stock);
    }

    #[Test]
    public function cannot_cancel_already_completed_redemption(): void
    {
        [$developer, $user, $reward, $redemption] = $this->createRedemption();
        $redemption->update(['status' => 'completed']);

        Sanctum::actingAs($developer);

        $this->patchJson("/api/admin/redemptions/{$redemption->id}", [
            'status' => 'cancelled',
        ])->assertStatus(422)
            ->assertJsonPath('errors.status.0', fn ($v) => ! empty($v));

        // Poin tidak berubah (tetap 0)
        $this->assertEquals(0, $user->fresh()->points_balance);
    }

    #[Test]
    public function cannot_set_invalid_status(): void
    {
        [$developer, $user, $reward, $redemption] = $this->createRedemption();

        Sanctum::actingAs($developer);

        $this->patchJson("/api/admin/redemptions/{$redemption->id}", [
            'status' => 'pending', // tidak valid — hanya completed atau cancelled
        ])->assertStatus(422);
    }

    #[Test]
    public function completing_redemption_does_not_change_points(): void
    {
        [$developer, $user, $reward, $redemption] = $this->createRedemption(75);

        Sanctum::actingAs($developer);

        $this->patchJson("/api/admin/redemptions/{$redemption->id}", [
            'status' => 'completed',
        ])->assertStatus(200)
            ->assertJsonPath('data.status', 'completed');

        // Poin tidak dikembalikan (complete bukan cancel)
        $this->assertEquals(0, $user->fresh()->points_balance);

        // Tidak ada adjustment transaction
        $this->assertEquals(0, PointTransaction::where('type', 'adjustment')->count());
    }
}
