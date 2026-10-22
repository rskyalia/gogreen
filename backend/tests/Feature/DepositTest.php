<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WasteBank;
use App\Models\WasteCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DepositTest extends TestCase
{
    use RefreshDatabase;

    private User $officer;

    private WasteBank $bank;

    private User $member;

    private WasteCategory $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->officer = User::factory()->wasteBank()->create();
        $this->bank = WasteBank::factory()->verified()->create(['user_id' => $this->officer->id]);
        $this->member = User::factory()->create(); // role=user, punya member_code
        $this->category = WasteCategory::factory()->create([
            'is_recyclable' => true,
            'points_per_kg' => 10,
        ]);

        // Pastikan kategori diterima oleh bank ini
        $this->bank->acceptedCategories()->attach($this->category->id);
    }

    // ── Member lookup ─────────────────────────────────────────────────────

    public function test_officer_can_find_member_by_code(): void
    {
        $this->actingAs($this->officer)
            ->getJson('/api/waste-bank/members/lookup?code='.$this->member->member_code)
            ->assertOk()
            ->assertJsonPath('data.id', $this->member->id)
            ->assertJsonPath('data.member_code', $this->member->member_code)
            ->assertJsonMissingPath('data.email')
            ->assertJsonMissingPath('data.phone');
    }

    public function test_invalid_member_code_returns_422(): void
    {
        $this->actingAs($this->officer)
            ->getJson('/api/waste-bank/members/lookup?code=GG-INVALID')
            ->assertUnprocessable()
            ->assertJsonPath('errors.identifier.0', 'Member dengan kode tersebut tidak ditemukan.');
    }

    public function test_banned_member_cannot_be_found(): void
    {
        $banned = User::factory()->banned()->create();

        $this->actingAs($this->officer)
            ->getJson('/api/waste-bank/members/lookup?code='.$banned->member_code)
            ->assertUnprocessable()
            ->assertJsonPath('errors.identifier.0', 'Akun member ini telah diblokir.');
    }

    public function test_non_user_role_member_code_is_rejected(): void
    {
        // Kode tidak ada → rejected
        $this->actingAs($this->officer)
            ->getJson('/api/waste-bank/members/lookup?code=GG-NOTEXIST')
            ->assertUnprocessable();
    }

    public function test_lookup_without_code_returns_422(): void
    {
        $this->actingAs($this->officer)
            ->getJson('/api/waste-bank/members/lookup')
            ->assertUnprocessable();
    }

    // ── Store deposit ─────────────────────────────────────────────────────

    public function test_deposit_is_stored_correctly(): void
    {
        $payload = [
            'member_code' => $this->member->member_code,
            'items' => [
                ['waste_category_id' => $this->category->id, 'weight_kg' => 2.5],
            ],
        ];

        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', $payload)
            ->assertCreated()
            ->assertJsonPath('data.total_weight_kg', 2.5)
            ->assertJsonPath('data.total_points', 25)  // 2.5 × 10
            ->assertJsonPath('member_balance', 25);

        $this->assertDatabaseHas('deposits', [
            'waste_bank_id' => $this->bank->id,
            'user_id' => $this->member->id,
            'total_points' => 25,
        ]);

        $this->assertDatabaseHas('deposit_items', [
            'weight_kg' => 2.50,
            'points' => 25,
        ]);

        $this->assertDatabaseHas('point_transactions', [
            'user_id' => $this->member->id,
            'type' => 'deposit',
            'points' => 25,
            'balance_after' => 25,
        ]);

        $this->assertDatabaseHas('users', [
            'id' => $this->member->id,
            'points_balance' => 25,
        ]);
    }

    public function test_points_are_rounded_correctly(): void
    {
        // 1.3 kg × 10 pts/kg = 13 pts (tidak ada desimal)
        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'member_code' => $this->member->member_code,
                'items' => [
                    ['waste_category_id' => $this->category->id, 'weight_kg' => 1.3],
                ],
            ])
            ->assertCreated()
            ->assertJsonPath('data.total_points', 13);
    }

    public function test_deposit_with_multiple_items(): void
    {
        $cat2 = WasteCategory::factory()->create(['is_recyclable' => true, 'points_per_kg' => 20]);
        $this->bank->acceptedCategories()->attach($cat2->id);

        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'member_code' => $this->member->member_code,
                'items' => [
                    ['waste_category_id' => $this->category->id, 'weight_kg' => 1.0], // 10 pts
                    ['waste_category_id' => $cat2->id,           'weight_kg' => 1.0], // 20 pts
                ],
            ])
            ->assertCreated()
            ->assertJsonPath('data.total_points', 30)
            ->assertJsonPath('member_balance', 30);

        $this->assertDatabaseCount('deposit_items', 2);
    }

    public function test_rejected_category_not_accepted_by_bank(): void
    {
        $otherCat = WasteCategory::factory()->create(['is_recyclable' => true]);
        // Tidak di-attach ke bank ini

        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'member_code' => $this->member->member_code,
                'items' => [
                    ['waste_category_id' => $otherCat->id, 'weight_kg' => 1.0],
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonPath('errors.items.0', 'Beberapa kategori tidak diterima oleh bank sampah ini.');

        // Pastikan tidak ada data yang tersimpan
        $this->assertDatabaseCount('deposits', 0);
        $this->assertDatabaseCount('point_transactions', 0);
        $this->assertDatabaseHas('users', [
            'id' => $this->member->id,
            'points_balance' => 0,
        ]);
    }

    public function test_banned_member_deposit_is_rejected(): void
    {
        $banned = User::factory()->banned()->create();

        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'member_code' => $banned->member_code,
                'items' => [
                    ['waste_category_id' => $this->category->id, 'weight_kg' => 1.0],
                ],
            ])
            ->assertUnprocessable();

        $this->assertDatabaseCount('deposits', 0);
    }

    public function test_unverified_bank_cannot_store_deposit(): void
    {
        $pendingOfficer = User::factory()->wasteBank()->create();
        WasteBank::factory()->create(['user_id' => $pendingOfficer->id]); // pending

        $this->actingAs($pendingOfficer)
            ->postJson('/api/waste-bank/deposits', [
                'member_code' => $this->member->member_code,
                'items' => [
                    ['waste_category_id' => $this->category->id, 'weight_kg' => 1.0],
                ],
            ])
            ->assertForbidden();
    }

    public function test_items_cannot_be_empty(): void
    {
        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'member_code' => $this->member->member_code,
                'items' => [],
            ])
            ->assertUnprocessable()
            ->assertJsonPath('errors.items.0', 'Minimal satu item sampah harus diisi.');
    }

    public function test_rollback_on_invalid_category_during_transaction(): void
    {
        // Gunakan kategori yang tidak diterima — validasi sebelum transaction
        // memastikan tidak ada setoran yang tersimpan
        $otherCat = WasteCategory::factory()->create();

        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'member_code' => $this->member->member_code,
                'items' => [
                    ['waste_category_id' => $otherCat->id, 'weight_kg' => 1.0],
                ],
            ])
            ->assertUnprocessable();

        $this->assertDatabaseCount('deposits', 0);
        $this->assertDatabaseCount('deposit_items', 0);
        $this->assertDatabaseCount('point_transactions', 0);
        $this->assertDatabaseHas('users', [
            'id' => $this->member->id, 'points_balance' => 0,
        ]);
    }
}
