<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WasteBank;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Tes fitur admin:
 * - User yang di-ban tidak bisa login
 * - Bank sampah pending tidak muncul di daftar peta publik
 */
class AdminFeatureTest extends TestCase
{
    use RefreshDatabase;

    // ── Ban blocks login ───────────────────────────────────────────────────

    #[Test]
    public function banned_user_cannot_login(): void
    {
        $user = User::factory()->banned()->create([
            'email' => 'banned@example.com',
            'password' => bcrypt('password'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'banned@example.com',
            'password' => 'password',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('message', fn ($msg) => str_contains($msg, 'diblokir'));
    }

    #[Test]
    public function active_user_can_login(): void
    {
        User::factory()->create([
            'email' => 'active@example.com',
            'password' => bcrypt('password'),
            'role' => 'user',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'active@example.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200)->assertJsonStructure(['token']);
    }

    #[Test]
    public function banning_user_deletes_all_tokens(): void
    {
        /** @var User $target */
        $target = User::factory()->create();
        $developer = User::factory()->developer()->create();

        // Buat token untuk target
        $target->createToken('device-1');
        $target->createToken('device-2');
        $this->assertEquals(2, $target->tokens()->count());

        Sanctum::actingAs($developer);

        $this->patchJson("/api/admin/users/{$target->id}/status", [
            'status' => 'banned',
            'banned_reason' => 'Pelanggaran berat.',
        ])->assertStatus(200);

        $this->assertEquals(0, $target->fresh()->tokens()->count());
    }

    #[Test]
    public function developer_cannot_ban_self(): void
    {
        $developer = User::factory()->developer()->create();
        Sanctum::actingAs($developer);

        $this->patchJson("/api/admin/users/{$developer->id}/status", [
            'status' => 'banned',
            'banned_reason' => 'test',
        ])->assertStatus(422);
    }

    #[Test]
    public function developer_cannot_ban_other_developer(): void
    {
        $dev1 = User::factory()->developer()->create();
        $dev2 = User::factory()->developer()->create();
        Sanctum::actingAs($dev1);

        $this->patchJson("/api/admin/users/{$dev2->id}/status", [
            'status' => 'banned',
            'banned_reason' => 'test',
        ])->assertStatus(422);
    }

    // ── Pending waste bank off map ─────────────────────────────────────────

    #[Test]
    public function pending_waste_bank_does_not_appear_in_verified_scope(): void
    {
        WasteBank::factory()->create(['verification_status' => 'pending']);
        WasteBank::factory()->create(['verification_status' => 'rejected']);
        $verified = WasteBank::factory()->verified()->create();

        $results = WasteBank::verified()->get();

        $this->assertCount(1, $results);
        $this->assertEquals($verified->id, $results->first()->id);
    }

    // ── Verify waste bank ─────────────────────────────────────────────────

    #[Test]
    public function developer_can_verify_waste_bank(): void
    {
        $developer = User::factory()->developer()->create();
        $bank = WasteBank::factory()->create(['verification_status' => 'pending']);

        Sanctum::actingAs($developer);

        $this->patchJson("/api/admin/waste-banks/{$bank->id}/verify", [
            'status' => 'verified',
        ])->assertStatus(200)
            ->assertJsonPath('data.verification_status', 'verified');

        $this->assertDatabaseHas('waste_banks', [
            'id' => $bank->id,
            'verification_status' => 'verified',
            'verified_by' => $developer->id,
        ]);
    }

    #[Test]
    public function reject_without_reason_returns_validation_error(): void
    {
        $developer = User::factory()->developer()->create();
        $bank = WasteBank::factory()->create();

        Sanctum::actingAs($developer);

        $this->patchJson("/api/admin/waste-banks/{$bank->id}/verify", [
            'status' => 'rejected',
        ])->assertStatus(422)
            ->assertJsonPath('errors.reason.0', fn ($v) => ! empty($v));
    }

    // ── Non-developer cannot access admin routes ───────────────────────────

    #[Test]
    public function non_developer_cannot_access_admin_stats(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/admin/stats')->assertStatus(403);
    }
}
