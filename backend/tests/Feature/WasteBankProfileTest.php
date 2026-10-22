<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WasteBank;
use App\Models\WasteCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WasteBankProfileTest extends TestCase
{
    use RefreshDatabase;

    private function makeVerifiedOfficer(): array
    {
        $user = User::factory()->wasteBank()->create();
        $bank = WasteBank::factory()->verified()->create(['user_id' => $user->id]);

        return [$user, $bank];
    }

    // ── GET profile ───────────────────────────────────────────────────────

    public function test_officer_can_get_profile(): void
    {
        [$user, $bank] = $this->makeVerifiedOfficer();

        $this->actingAs($user)
            ->getJson('/api/waste-bank/profile')
            ->assertOk()
            ->assertJsonPath('data.id', $bank->id)
            ->assertJsonPath('data.verification_status', 'verified')
            ->assertJsonStructure([
                'data' => [
                    'id', 'name', 'address', 'latitude', 'longitude',
                    'phone', 'description', 'opening_hours', 'is_open',
                    'verification_status', 'accepted_categories',
                ],
            ]);
    }

    public function test_pending_officer_can_still_get_profile(): void
    {
        $user = User::factory()->wasteBank()->create();
        WasteBank::factory()->create(['user_id' => $user->id]); // pending

        $this->actingAs($user)
            ->getJson('/api/waste-bank/profile')
            ->assertOk()
            ->assertJsonPath('data.verification_status', 'pending');
    }

    // ── PUT profile ───────────────────────────────────────────────────────

    public function test_officer_can_update_profile(): void
    {
        [$user] = $this->makeVerifiedOfficer();

        $this->actingAs($user)
            ->putJson('/api/waste-bank/profile', [
                'name' => 'Nama Baru',
                'address' => 'Jl. Baru No. 1',
                'phone' => '021-999',
                'description' => 'Deskripsi',
                'latitude' => -6.2,
                'longitude' => 106.8,
                'opening_hours' => ['senin' => '08:00-17:00'],
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Nama Baru');
    }

    public function test_profile_update_validates_coordinates(): void
    {
        [$user] = $this->makeVerifiedOfficer();

        $this->actingAs($user)
            ->putJson('/api/waste-bank/profile', [
                'name' => 'Test',
                'address' => 'Jl.',
                'phone' => '021',
                'latitude' => 999,   // invalid
                'longitude' => 106.8,
                'opening_hours' => ['senin' => '08:00'],
            ])
            ->assertUnprocessable()
            ->assertJsonPath('errors.latitude.0', 'Latitude harus antara -90 dan 90.');
    }

    // ── PATCH status (toggle is_open) ─────────────────────────────────────

    public function test_verified_officer_can_toggle_status(): void
    {
        [$user, $bank] = $this->makeVerifiedOfficer();

        $originalStatus = $bank->is_open;

        $this->actingAs($user)
            ->patchJson('/api/waste-bank/status')
            ->assertOk()
            ->assertJsonPath('is_open', ! $originalStatus);

        $this->assertDatabaseHas('waste_banks', [
            'id' => $bank->id,
            'is_open' => ! $originalStatus,
        ]);
    }

    public function test_unverified_officer_cannot_toggle_status(): void
    {
        $user = User::factory()->wasteBank()->create();
        WasteBank::factory()->create(['user_id' => $user->id]); // pending

        $this->actingAs($user)
            ->patchJson('/api/waste-bank/status')
            ->assertForbidden();
    }

    // ── PUT categories ────────────────────────────────────────────────────

    public function test_officer_can_sync_categories(): void
    {
        [$user, $bank] = $this->makeVerifiedOfficer();
        $cat1 = WasteCategory::factory()->create(['is_recyclable' => true]);
        $cat2 = WasteCategory::factory()->create(['is_recyclable' => true]);

        $this->actingAs($user)
            ->putJson('/api/waste-bank/categories', [
                'category_ids' => [$cat1->id, $cat2->id],
            ])
            ->assertOk()
            ->assertJsonPath('message', 'Kategori berhasil diperbarui.');

        $this->assertDatabaseHas('waste_bank_categories', [
            'waste_bank_id' => $bank->id,
            'waste_category_id' => $cat1->id,
        ]);
    }

    public function test_non_recyclable_categories_are_excluded_from_sync(): void
    {
        [$user, $bank] = $this->makeVerifiedOfficer();
        $recyclable = WasteCategory::factory()->create(['is_recyclable' => true]);
        $nonRecyclable = WasteCategory::factory()->create(['is_recyclable' => false]);

        $this->actingAs($user)
            ->putJson('/api/waste-bank/categories', [
                'category_ids' => [$recyclable->id, $nonRecyclable->id],
            ])
            ->assertOk();

        // non-recyclable tidak boleh masuk pivot
        $this->assertDatabaseMissing('waste_bank_categories', [
            'waste_bank_id' => $bank->id,
            'waste_category_id' => $nonRecyclable->id,
        ]);
    }
}
