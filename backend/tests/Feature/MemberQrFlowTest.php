<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WasteBank;
use App\Models\WasteCategory;
use App\Services\QrTokenService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Tes fitur untuk alur lengkap token QR sesuai spesifikasi Stage 2:
 *   - POST /api/user/member-token menggunakan issue() → token_in_process bila claimed
 *   - GET  /api/user/member-token/status → 404 bila token milik user lain
 *   - POST /api/waste-bank/members/release → hanya oleh pemilik klaim
 */
class MemberQrFlowTest extends TestCase
{
    use RefreshDatabase;

    private User $member;

    private User $officer;

    private WasteBank $bank;

    private QrTokenService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = app(QrTokenService::class);
        $this->member = User::factory()->create();
        $this->officer = User::factory()->wasteBank()->create();
        $this->bank = WasteBank::factory()->verified()->create([
            'user_id' => $this->officer->id,
        ]);
    }

    // ── issue: token_in_process ────────────────────────────────────────────

    #[Test]
    public function generate_token_endpoint_returns_token_in_process_when_claimed(): void
    {
        // Buat token yang diklaim oleh bank sampah
        $data = $this->service->generate($this->member->id);
        $this->service->claim($data['token'], $this->bank->id);

        // User coba buat token baru — harus 409 token_in_process
        $this->actingAs($this->member)
            ->postJson('/api/user/member-token')
            ->assertStatus(409)
            ->assertJsonPath('code', 'token_in_process');
    }

    #[Test]
    public function generate_token_replaces_old_active_token(): void
    {
        $first = $this->actingAs($this->member)
            ->postJson('/api/user/member-token')
            ->json('data.token');

        $second = $this->actingAs($this->member)
            ->postJson('/api/user/member-token')
            ->json('data.token');

        $this->assertNotSame($first, $second);
        $this->assertNull(Cache::get(QrTokenService::tokenKey($first)));
        $this->assertNotNull(Cache::get(QrTokenService::tokenKey($second)));
    }

    #[Test]
    public function generate_token_response_contains_payload_with_gogreen_prefix(): void
    {
        $res = $this->actingAs($this->member)
            ->postJson('/api/user/member-token')
            ->assertOk()
            ->assertJsonStructure(['data' => ['token', 'payload', 'expires_at']]);

        $token = $res->json('data.token');
        $payload = $res->json('data.payload');

        $this->assertSame(32, strlen($token));
        $this->assertSame('gogreen://member/'.$token, $payload);
    }

    // ── tokenStatus: 404 untuk token milik user lain ─────────────────────

    #[Test]
    public function token_status_returns_404_for_other_users_token(): void
    {
        $tokenData = $this->service->generate($this->member->id);

        $otherUser = User::factory()->create();

        $this->actingAs($otherUser)
            ->getJson('/api/user/member-token/status?token='.$tokenData['token'])
            ->assertStatus(404)
            ->assertJsonPath('code', 'token_invalid');
    }

    #[Test]
    public function token_status_returns_active_for_owner(): void
    {
        $tokenData = $this->actingAs($this->member)
            ->postJson('/api/user/member-token')
            ->json('data.token');

        $this->actingAs($this->member)
            ->getJson('/api/user/member-token/status?token='.$tokenData)
            ->assertOk()
            ->assertJsonPath('data.status', 'active')
            ->assertJsonStructure(['data' => ['status', 'expires_at']]);
    }

    #[Test]
    public function token_status_claimed_shows_bank_name(): void
    {
        $tokenData = $this->service->generate($this->member->id);
        $this->service->claim($tokenData['token'], $this->bank->id);

        $this->actingAs($this->member)
            ->getJson('/api/user/member-token/status?token='.$tokenData['token'])
            ->assertOk()
            ->assertJsonPath('data.status', 'claimed')
            ->assertJsonPath('data.waste_bank_name', $this->bank->name)
            ->assertJsonStructure(['data' => ['status', 'waste_bank_name', 'expires_at']]);
    }

    #[Test]
    public function token_status_expired_returns_correctly(): void
    {
        // Token yang tidak ada di cache → expired
        $fakeToken = str_repeat('e', 32);

        $this->actingAs($this->member)
            ->getJson('/api/user/member-token/status?token='.$fakeToken)
            ->assertOk()
            ->assertJsonPath('data.status', 'expired');
    }

    // ── release: POST /api/waste-bank/members/release ─────────────────────

    #[Test]
    public function release_by_claim_owner_succeeds(): void
    {
        $tokenData = $this->service->generate($this->member->id);
        $this->service->claim($tokenData['token'], $this->bank->id);

        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/members/release', ['token' => $tokenData['token']])
            ->assertOk()
            ->assertJsonPath('code', 'ok');

        // Token kembali active
        $this->assertSame('active', $this->service->status($tokenData['token'])['status']);
    }

    #[Test]
    public function release_by_other_bank_returns_409(): void
    {
        $otherOfficer = User::factory()->wasteBank()->create();
        $otherBank = WasteBank::factory()->verified()->create([
            'user_id' => $otherOfficer->id,
        ]);

        $tokenData = $this->service->generate($this->member->id);
        // Bank pertama klaim
        $this->service->claim($tokenData['token'], $this->bank->id);

        // Bank lain coba release
        $this->actingAs($otherOfficer)
            ->postJson('/api/waste-bank/members/release', ['token' => $tokenData['token']])
            ->assertStatus(409)
            ->assertJsonPath('code', 'token_claimed_by_other');

        // Token tetap claimed oleh bank pertama
        $this->assertSame('claimed', $this->service->status($tokenData['token'])['status']);
    }

    #[Test]
    public function release_expired_token_returns_422(): void
    {
        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/members/release', ['token' => str_repeat('x', 32)])
            ->assertStatus(422)
            ->assertJsonPath('code', 'token_expired');
    }

    #[Test]
    public function release_used_token_returns_409(): void
    {
        $tokenData = $this->service->generate($this->member->id);
        $this->service->claim($tokenData['token'], $this->bank->id);
        $this->service->consume($tokenData['token'], $this->bank->id, [
            'deposit_id' => 1,
            'waste_bank_name' => $this->bank->name,
            'total_weight_kg' => 1.0,
            'total_points' => 10,
            'balance_after' => 10,
        ]);

        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/members/release', ['token' => $tokenData['token']])
            ->assertStatus(409)
            ->assertJsonPath('code', 'token_used');
    }

    #[Test]
    public function release_requires_valid_token_format(): void
    {
        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/members/release', ['token' => 'terlalu-pendek'])
            ->assertStatus(422)
            ->assertJsonPath('code', 'token_invalid');
    }

    #[Test]
    public function release_requires_verified_bank(): void
    {
        $unverifiedOfficer = User::factory()->wasteBank()->create();
        WasteBank::factory()->create(['user_id' => $unverifiedOfficer->id]); // pending

        $this->actingAs($unverifiedOfficer)
            ->postJson('/api/waste-bank/members/release', ['token' => str_repeat('a', 32)])
            ->assertStatus(403)
            ->assertJsonPath('code', 'bank_not_verified');
    }

    // ── lookup dengan member_code tidak mengubah status token ─────────────

    #[Test]
    public function lookup_by_code_does_not_affect_token_status(): void
    {
        $tokenData = $this->service->generate($this->member->id);

        // Lookup manual dengan kode
        $this->actingAs($this->officer)
            ->getJson('/api/waste-bank/members/lookup?code='.$this->member->member_code)
            ->assertOk()
            ->assertJsonPath('data.id', $this->member->id)
            ->assertJsonMissingPath('data.email')
            ->assertJsonMissingPath('data.phone')
            ->assertJsonMissingPath('data.points_balance');

        // Token tetap active (tidak diklaim)
        $this->assertSame('active', $this->service->status($tokenData['token'])['status']);
    }

    // ── lookup ulang oleh bank yang sama ──────────────────────────────────

    #[Test]
    public function relookup_by_same_bank_is_idempotent(): void
    {
        $tokenData = $this->service->generate($this->member->id);

        // Lookup pertama → klaim
        $res1 = $this->actingAs($this->officer)
            ->getJson('/api/waste-bank/members/lookup?token='.$tokenData['token'])
            ->assertOk();

        // Lookup kedua oleh bank yang sama → ok
        $res2 = $this->actingAs($this->officer)
            ->getJson('/api/waste-bank/members/lookup?token='.$tokenData['token'])
            ->assertOk();

        $this->assertSame($res1->json('data.id'), $res2->json('data.id'));
        $this->assertSame('claimed', $this->service->status($tokenData['token'])['status']);
    }

    // ── lookup oleh bank lain setelah klaim → 409 ────────────────────────

    #[Test]
    public function lookup_by_second_bank_returns_409(): void
    {
        $otherOfficer = User::factory()->wasteBank()->create();
        WasteBank::factory()->verified()->create(['user_id' => $otherOfficer->id]);

        $tokenData = $this->service->generate($this->member->id);
        $this->service->claim($tokenData['token'], $this->bank->id);

        $this->actingAs($otherOfficer)
            ->getJson('/api/waste-bank/members/lookup?token='.$tokenData['token'])
            ->assertStatus(409)
            ->assertJsonPath('code', 'token_claimed_by_other');
    }

    // ── user banned / bukan role user ─────────────────────────────────────

    #[Test]
    public function lookup_of_banned_user_returns_403(): void
    {
        $this->member->update(['status' => 'banned']);

        $tokenData = $this->service->generate($this->member->id);

        $this->actingAs($this->officer)
            ->getJson('/api/waste-bank/members/lookup?token='.$tokenData['token'])
            ->assertStatus(403)
            ->assertJsonPath('code', 'user_banned');
    }

    #[Test]
    public function lookup_of_non_user_role_returns_404(): void
    {
        $community = User::factory()->community()->create();
        $tokenData = $this->service->generate($community->id);

        $this->actingAs($this->officer)
            ->getJson('/api/waste-bank/members/lookup?token='.$tokenData['token'])
            ->assertStatus(404)
            ->assertJsonPath('code', 'user_not_found');
    }

    // ── dua klaim bersamaan: hanya satu yang berhasil ─────────────────────

    #[Test]
    public function concurrent_claim_only_one_succeeds(): void
    {
        $otherOfficer = User::factory()->wasteBank()->create();
        $otherBank = WasteBank::factory()->verified()->create([
            'user_id' => $otherOfficer->id,
        ]);

        $tokenData = $this->service->generate($this->member->id);

        $first = $this->service->claim($tokenData['token'], $this->bank->id);
        $second = $this->service->claim($tokenData['token'], $otherBank->id);

        $this->assertTrue($first['success']);
        $this->assertFalse($second['success']);
        $this->assertSame('token_claimed_by_other', $second['code']);
    }

    // ── token kedaluwarsa dan tidak dikenal ───────────────────────────────

    #[Test]
    public function unknown_token_in_lookup_returns_422_token_expired(): void
    {
        $this->actingAs($this->officer)
            ->getJson('/api/waste-bank/members/lookup?token='.str_repeat('u', 32))
            ->assertStatus(422)
            ->assertJsonPath('code', 'token_expired');
    }

    #[Test]
    public function unknown_token_in_deposit_returns_422_token_expired(): void
    {
        $category = WasteCategory::factory()->create(['points_per_kg' => 10]);
        $this->bank->acceptedCategories()->attach($category->id);

        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'token' => str_repeat('u', 32),
                'client_request_id' => Str::uuid()->toString(),
                'items' => [['waste_category_id' => $category->id, 'weight_kg' => 1.0]],
            ])
            ->assertStatus(422)
            ->assertJsonPath('code', 'token_expired');
    }
}
