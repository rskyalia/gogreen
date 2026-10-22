<?php

namespace Tests\Feature;

use App\Http\Controllers\User\MemberCardController;
use App\Models\User;
use App\Models\WasteBank;
use App\Models\WasteCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class MemberTokenTest extends TestCase
{
    use RefreshDatabase;

    private User $member;

    private User $officer;

    private WasteBank $bank;

    private WasteCategory $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->member = User::factory()->create();                                  // role=user
        $this->officer = User::factory()->wasteBank()->create();
        $this->bank = WasteBank::factory()->verified()->create(['user_id' => $this->officer->id]);
        $this->category = WasteCategory::factory()->create(['points_per_kg' => 10]);

        $this->bank->acceptedCategories()->attach($this->category->id);
    }

    // ── GET /api/user/member-card ─────────────────────────────────────────

    public function test_user_can_get_member_card_data(): void
    {
        $this->actingAs($this->member)
            ->getJson('/api/user/member-card')
            ->assertOk()
            ->assertJsonStructure(['data' => ['id', 'name', 'avatar', 'member_code', 'points_balance']])
            ->assertJsonPath('data.member_code', $this->member->member_code)
            ->assertJsonMissingPath('data.email')
            ->assertJsonMissingPath('data.phone');
    }

    public function test_non_user_role_cannot_access_member_card(): void
    {
        $officer = User::factory()->wasteBank()->create();

        $this->actingAs($officer)
            ->getJson('/api/user/member-card')
            ->assertForbidden();
    }

    // ── POST /api/user/member-token ───────────────────────────────────────

    public function test_user_can_generate_token(): void
    {
        $response = $this->actingAs($this->member)
            ->postJson('/api/user/member-token')
            ->assertOk()
            ->assertJsonStructure(['data' => ['token', 'expires_at']]);

        $token = $response->json('data.token');
        $this->assertSame(32, strlen($token));

        // Harus tersimpan di cache
        $cachedUserId = Cache::get(MemberCardController::tokenCacheKey($token));
        $this->assertSame($this->member->id, $cachedUserId);
    }

    public function test_generating_new_token_invalidates_old_one(): void
    {
        // Token pertama
        $first = $this->actingAs($this->member)
            ->postJson('/api/user/member-token')
            ->json('data.token');

        // Token kedua
        $second = $this->actingAs($this->member)
            ->postJson('/api/user/member-token')
            ->json('data.token');

        // Token pertama harus dihapus dari cache
        $this->assertNull(Cache::get(MemberCardController::tokenCacheKey($first)));

        // Token kedua masih valid
        $this->assertNotNull(Cache::get(MemberCardController::tokenCacheKey($second)));
    }

    // ── GET /api/waste-bank/members/lookup?code=<token> ──────────────────

    public function test_officer_can_lookup_member_by_token(): void
    {
        $token = $this->actingAs($this->member)
            ->postJson('/api/user/member-token')
            ->json('data.token');

        $this->actingAs($this->officer)
            ->getJson('/api/waste-bank/members/lookup?code='.$token)
            ->assertOk()
            ->assertJsonPath('data.id', $this->member->id)
            ->assertJsonMissingPath('data.email')
            ->assertJsonMissingPath('data.phone');
    }

    public function test_expired_token_returns_422(): void
    {
        $fakeToken = str_repeat('x', 32);

        $this->actingAs($this->officer)
            ->getJson('/api/waste-bank/members/lookup?code='.$fakeToken)
            ->assertUnprocessable()
            ->assertJsonPath('errors.identifier.0', 'Token QR tidak valid atau sudah kedaluwarsa.');
    }

    // ── POST /api/waste-bank/deposits — token sebagai identitas ──────────

    public function test_valid_token_can_be_used_for_deposit(): void
    {
        $token = $this->actingAs($this->member)
            ->postJson('/api/user/member-token')
            ->json('data.token');

        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'member_token' => $token,
                'items' => [
                    ['waste_category_id' => $this->category->id, 'weight_kg' => 2.0],
                ],
            ])
            ->assertCreated()
            ->assertJsonPath('data.total_points', 20);

        // Setelah berhasil, token harus hangus
        $this->assertNull(Cache::get(MemberCardController::tokenCacheKey($token)));
    }

    public function test_token_cannot_be_used_twice(): void
    {
        $token = $this->actingAs($this->member)
            ->postJson('/api/user/member-token')
            ->json('data.token');

        // Pemakaian pertama — berhasil
        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'member_token' => $token,
                'items' => [['waste_category_id' => $this->category->id, 'weight_kg' => 1.0]],
            ])
            ->assertCreated();

        // Pemakaian kedua — harus ditolak
        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'member_token' => $token,
                'items' => [['waste_category_id' => $this->category->id, 'weight_kg' => 1.0]],
            ])
            ->assertUnprocessable()
            ->assertJsonPath('errors.identifier.0', 'Token QR tidak valid atau sudah kedaluwarsa.');

        // Pastikan hanya 1 deposit yang tercatat
        $this->assertDatabaseCount('deposits', 1);
    }

    public function test_expired_token_is_rejected_in_deposit(): void
    {
        $fakeToken = str_repeat('z', 32);

        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'member_token' => $fakeToken,
                'items' => [['waste_category_id' => $this->category->id, 'weight_kg' => 1.0]],
            ])
            ->assertUnprocessable()
            ->assertJsonPath('errors.identifier.0', 'Token QR tidak valid atau sudah kedaluwarsa.');

        $this->assertDatabaseCount('deposits', 0);
    }

    public function test_member_code_still_works_for_deposit(): void
    {
        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'member_code' => $this->member->member_code,
                'items' => [['waste_category_id' => $this->category->id, 'weight_kg' => 1.5]],
            ])
            ->assertCreated()
            ->assertJsonPath('data.total_points', 15);
    }
}
