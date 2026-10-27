<?php

namespace Tests\Feature;

use App\Models\Deposit;
use App\Models\User;
use App\Models\WasteBank;
use App\Models\WasteCategory;
use App\Notifications\DepositRecorded;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Tests\TestCase;

class UserDashboardTest extends TestCase
{
    use RefreshDatabase;

    private User $member;

    private User $memberB;

    private User $officer;

    private WasteBank $bank;

    private WasteCategory $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->member = User::factory()->create();
        $this->memberB = User::factory()->create();
        $this->officer = User::factory()->wasteBank()->create();
        $this->bank = WasteBank::factory()->verified()->create(['user_id' => $this->officer->id]);
        $this->category = WasteCategory::factory()->create(['points_per_kg' => 10]);

        $this->bank->acceptedCategories()->attach($this->category->id);
    }

    // ── Helper: buat deposit melalui API agar service & notifikasi terpanggil ──

    private function makeDeposit(User $member, float $kg = 2.0): array
    {
        $response = $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'member_code' => $member->member_code,
                'client_request_id' => Str::uuid()->toString(),
                'items' => [['waste_category_id' => $this->category->id, 'weight_kg' => $kg]],
            ]);

        $response->assertCreated();

        return $response->json('data');
    }

    // ── GET /api/user/summary ─────────────────────────────────────────────

    public function test_summary_returns_correct_fields(): void
    {
        $this->makeDeposit($this->member, 3.0); // 3 × 10 = 30 pts

        $response = $this->actingAs($this->member)
            ->getJson('/api/user/summary')
            ->assertOk()
            ->assertJsonPath('data.points_balance', 30)
            ->assertJsonPath('data.deposit_count', 1)
            ->assertJsonStructure(['data' => ['last_deposit' => ['id', 'waste_bank_name', 'total_kg', 'total_points', 'created_at']]]);

        // JSON bisa return 3 atau 3.0 — cukup pastikan nilainya sama
        $this->assertEquals(3.0, $response->json('data.total_kg'));
    }

    public function test_summary_does_not_expose_other_user_data(): void
    {
        $this->makeDeposit($this->memberB, 5.0); // deposit milik B

        $response = $this->actingAs($this->member)
            ->getJson('/api/user/summary')
            ->assertOk();

        $this->assertSame(0, $response->json('data.deposit_count'));
        $this->assertEquals(0, $response->json('data.total_kg')); // 0 atau 0.0
        $this->assertNull($response->json('data.last_deposit'));
    }

    // ── GET /api/user/deposits ────────────────────────────────────────────

    public function test_user_sees_only_own_deposits(): void
    {
        $this->makeDeposit($this->member, 2.0);
        $this->makeDeposit($this->memberB, 5.0); // tidak boleh muncul

        $response = $this->actingAs($this->member)
            ->getJson('/api/user/deposits')
            ->assertOk();

        $this->assertCount(1, $response->json('data'));
        $this->assertSame(20, $response->json('data.0.total_points'));
    }

    public function test_deposits_response_structure(): void
    {
        $this->makeDeposit($this->member, 2.0);

        $this->actingAs($this->member)
            ->getJson('/api/user/deposits')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'waste_bank_name', 'total_weight_kg', 'total_points', 'items', 'created_at']],
                'meta' => ['current_page', 'last_page', 'total', 'per_page'],
            ])
            ->assertJsonMissingPath('data.0.member'); // member_code/email tidak bocor
    }

    public function test_deposit_detail_scoped_to_owner(): void
    {
        $depositData = $this->makeDeposit($this->member);
        $depositId = $depositData['id'];

        // Pemilik bisa lihat
        $this->actingAs($this->member)
            ->getJson("/api/user/deposits/{$depositId}")
            ->assertOk();

        // User lain tidak bisa lihat
        $this->actingAs($this->memberB)
            ->getJson("/api/user/deposits/{$depositId}")
            ->assertNotFound();
    }

    // ── GET /api/user/points ──────────────────────────────────────────────

    public function test_point_ledger_shows_only_own_transactions(): void
    {
        $this->makeDeposit($this->member, 1.0);  // 10 pts untuk member
        $this->makeDeposit($this->memberB, 1.0); // 10 pts untuk memberB

        $response = $this->actingAs($this->member)
            ->getJson('/api/user/points')
            ->assertOk();

        $this->assertCount(1, $response->json('data'));
        $this->assertSame(10, $response->json('data.0.points'));
    }

    public function test_point_ledger_filter_by_type(): void
    {
        $this->makeDeposit($this->member, 1.0);

        $this->actingAs($this->member)
            ->getJson('/api/user/points?type=deposit')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->actingAs($this->member)
            ->getJson('/api/user/points?type=redeem')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    // ── Notifikasi ────────────────────────────────────────────────────────

    public function test_notification_is_created_after_deposit(): void
    {
        Notification::fake();

        $this->makeDeposit($this->member, 2.0);

        Notification::assertSentTo(
            $this->member->fresh(),
            DepositRecorded::class,
        );
    }

    public function test_notification_created_only_once_per_deposit(): void
    {
        $this->makeDeposit($this->member, 1.0);

        // Tepat 1 baris notifikasi di DB untuk member ini
        $this->assertDatabaseCount('notifications', 1);
        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $this->member->id,
            'notifiable_type' => User::class,
        ]);
    }

    public function test_notification_not_created_on_failed_deposit(): void
    {
        // Kategori tidak ada → deposit gagal → notifikasi tidak dikirim
        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'member_code' => $this->member->member_code,
                'items' => [['waste_category_id' => 9999, 'weight_kg' => 1.0]],
            ])
            ->assertUnprocessable();

        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_get_notifications_endpoint(): void
    {
        $this->makeDeposit($this->member, 1.0);

        $this->actingAs($this->member)
            ->getJson('/api/user/notifications')
            ->assertOk()
            ->assertJsonStructure(['data' => [['id', 'type', 'data', 'read_at', 'created_at']], 'unread_count'])
            ->assertJsonPath('unread_count', 1);
    }

    public function test_mark_notification_as_read(): void
    {
        $this->makeDeposit($this->member, 1.0);

        $notifId = $this->actingAs($this->member)
            ->getJson('/api/user/notifications')
            ->json('data.0.id');

        $this->actingAs($this->member)
            ->patchJson("/api/user/notifications/{$notifId}/read")
            ->assertOk();

        $this->actingAs($this->member)
            ->getJson('/api/user/notifications')
            ->assertJsonPath('unread_count', 0);
    }

    public function test_mark_all_notifications_read(): void
    {
        $this->makeDeposit($this->member, 1.0);
        $this->makeDeposit($this->member, 1.0);

        $this->actingAs($this->member)
            ->getJson('/api/user/notifications')
            ->assertJsonPath('unread_count', 2);

        $this->actingAs($this->member)
            ->patchJson('/api/user/notifications/read-all')
            ->assertOk();

        $this->actingAs($this->member)
            ->getJson('/api/user/notifications')
            ->assertJsonPath('unread_count', 0);
    }

    public function test_user_cannot_read_other_users_notification(): void
    {
        $this->makeDeposit($this->member, 1.0);

        $notifId = $this->actingAs($this->member)
            ->getJson('/api/user/notifications')
            ->json('data.0.id');

        // memberB coba baca notifikasi milik member
        $this->actingAs($this->memberB)
            ->patchJson("/api/user/notifications/{$notifId}/read")
            ->assertNotFound();
    }
}
