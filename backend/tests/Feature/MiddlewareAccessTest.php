<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WasteBank;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Menguji RoleMiddleware dan WasteBankVerifiedMiddleware secara terisolasi.
 *
 * Strategi: daftarkan route sementara di dalam setiap test menggunakan
 * Route::get() sebelum request dikirim.  Hal ini memungkinkan kita menguji
 * perilaku middleware tanpa bergantung pada route produksi yang belum ada.
 */
class MiddlewareAccessTest extends TestCase
{
    use RefreshDatabase;

    // ── Helpers ───────────────────────────────────────────────────────────

    /** Daftarkan route sementara yang dilindungi middleware tertentu. */
    private function fakeRoute(string $uri, string $middleware): void
    {
        Route::middleware(['api', 'auth:sanctum', $middleware])
            ->get($uri, fn () => response()->json(['ok' => true]));
    }

    private function fakeRouteWasteBankVerified(string $uri): void
    {
        Route::middleware(['api', 'auth:sanctum', 'role:waste_bank', 'waste_bank.verified'])
            ->get($uri, fn () => response()->json(['ok' => true]));
    }

    // ══════════════════════════════════════════════════════════════════════
    //  RoleMiddleware
    // ══════════════════════════════════════════════════════════════════════

    /** Guest tanpa token harus mendapat 401. */
    public function test_unauthenticated_request_returns_401(): void
    {
        $this->fakeRoute('/api/test-role', 'role:developer');

        $this->getJson('/api/test-role')->assertStatus(401);
    }

    /** User dengan role yang sesuai boleh masuk. */
    public function test_correct_role_passes(): void
    {
        $this->fakeRoute('/api/test-developer', 'role:developer');

        $user = User::factory()->developer()->create();

        $this->actingAs($user)
            ->getJson('/api/test-developer')
            ->assertOk()
            ->assertJson(['ok' => true]);
    }

    /** User dengan role yang salah harus mendapat 403. */
    public function test_wrong_role_returns_403(): void
    {
        $this->fakeRoute('/api/test-developer-2', 'role:developer');

        $user = User::factory()->create(); // role: user

        $this->actingAs($user)
            ->getJson('/api/test-developer-2')
            ->assertForbidden()
            ->assertJsonStructure(['message', 'errors' => ['role']]);
    }

    /** Multi-role: 'role:developer,community' harus memberi akses ke keduanya. */
    public function test_multi_role_allows_any_matching_role(): void
    {
        $this->fakeRoute('/api/test-multi', 'role:developer,community');

        $developer = User::factory()->developer()->create();
        $community = User::factory()->community()->create();
        $user = User::factory()->create(); // role: user

        $this->actingAs($developer)->getJson('/api/test-multi')->assertOk();
        $this->actingAs($community)->getJson('/api/test-multi')->assertOk();
        $this->actingAs($user)->getJson('/api/test-multi')->assertForbidden();
    }

    /** Response 403 harus mengikuti format error standar. */
    public function test_role_403_response_format(): void
    {
        $this->fakeRoute('/api/test-fmt', 'role:developer');

        $user = User::factory()->wasteBank()->create();

        $response = $this->actingAs($user)->getJson('/api/test-fmt');

        $response->assertForbidden()
            ->assertJsonStructure(['message', 'errors'])
            ->assertJsonPath('errors.role.0', fn ($v) => str_contains($v, 'developer'));
    }

    // ══════════════════════════════════════════════════════════════════════
    //  WasteBankVerifiedMiddleware
    // ══════════════════════════════════════════════════════════════════════

    /** Waste bank dengan status pending harus mendapat 403. */
    public function test_pending_waste_bank_is_rejected(): void
    {
        $this->fakeRouteWasteBankVerified('/api/test-wb-pending');

        $user = User::factory()->wasteBank()->create();
        WasteBank::factory()->create(['user_id' => $user->id]); // default: pending

        $response = $this->actingAs($user)->getJson('/api/test-wb-pending');

        $response->assertForbidden()
            ->assertJsonStructure(['message', 'errors' => ['verification']])
            ->assertJsonPath('message', fn ($msg) => str_contains($msg, 'belum diverifikasi'));
    }

    /** Waste bank dengan status rejected harus mendapat 403 dengan pesan berbeda. */
    public function test_rejected_waste_bank_is_rejected(): void
    {
        $this->fakeRouteWasteBankVerified('/api/test-wb-rejected');

        $user = User::factory()->wasteBank()->create();
        WasteBank::factory()->create([
            'user_id' => $user->id,
            'verification_status' => 'rejected',
        ]);

        $response = $this->actingAs($user)->getJson('/api/test-wb-rejected');

        $response->assertForbidden()
            ->assertJsonPath('message', fn ($msg) => str_contains($msg, 'ditolak'));
    }

    /** Waste bank yang sudah verified harus bisa lewat. */
    public function test_verified_waste_bank_passes(): void
    {
        $this->fakeRouteWasteBankVerified('/api/test-wb-verified');

        $user = User::factory()->wasteBank()->create();
        WasteBank::factory()->verified()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->getJson('/api/test-wb-verified')
            ->assertOk()
            ->assertJson(['ok' => true]);
    }

    /** User tanpa record WasteBank sama sekali harus ditolak dengan pesan jelas. */
    public function test_waste_bank_user_without_bank_record_is_rejected(): void
    {
        $this->fakeRouteWasteBankVerified('/api/test-wb-no-record');

        $user = User::factory()->wasteBank()->create(); // tidak ada WasteBank record

        $response = $this->actingAs($user)->getJson('/api/test-wb-no-record');

        $response->assertForbidden()
            ->assertJsonPath('errors.verification.0', fn ($v) => str_contains($v, 'tidak terdaftar'));
    }

    /** Role non-waste_bank tidak boleh melewati waste_bank.verified. */
    public function test_non_waste_bank_role_blocked_before_verified_check(): void
    {
        $this->fakeRouteWasteBankVerified('/api/test-wb-wrong-role');

        $developer = User::factory()->developer()->create();

        // Middleware role:waste_bank yang ada lebih dulu sudah memblokir
        $this->actingAs($developer)
            ->getJson('/api/test-wb-wrong-role')
            ->assertForbidden();
    }
}
