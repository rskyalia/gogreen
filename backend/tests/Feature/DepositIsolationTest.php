<?php

namespace Tests\Feature;

use App\Models\Deposit;
use App\Models\User;
use App\Models\WasteBank;
use App\Models\WasteCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Memastikan isolasi data antar bank sampah:
 * bank A tidak boleh melihat data milik bank B.
 */
class DepositIsolationTest extends TestCase
{
    use RefreshDatabase;

    private function makeBankWithDeposit(): array
    {
        $officer = User::factory()->wasteBank()->create();
        $bank = WasteBank::factory()->verified()->create(['user_id' => $officer->id]);
        $member = User::factory()->create();
        $category = WasteCategory::factory()->create(['points_per_kg' => 5]);
        $bank->acceptedCategories()->attach($category->id);

        $deposit = Deposit::create([
            'waste_bank_id' => $bank->id,
            'user_id' => $member->id,
            'recorded_by' => $officer->id,
            'total_weight_kg' => 1.0,
            'total_points' => 5,
        ]);
        $deposit->items()->create([
            'waste_category_id' => $category->id,
            'weight_kg' => 1.0,
            'points' => 5,
        ]);

        return [$officer, $bank, $deposit];
    }

    public function test_bank_a_cannot_see_bank_b_deposit_in_list(): void
    {
        // Buat bank B dulu dengan satu deposit
        [$officerB, $bankB, $depositB] = $this->makeBankWithDeposit();

        // Buat bank A tanpa deposit
        [$officerA, $bankA] = $this->makeBankWithDeposit();

        // Hapus deposit yang secara tidak sengaja dibuat untuk bank A
        // (makeBankWithDeposit selalu buat 1 deposit — kita perlu bank A tanpa deposit)
        $bankA->deposits()->delete();

        // Pastikan kondisi test benar
        $this->assertDatabaseCount('deposits', 1);
        $this->assertEquals($bankB->id, Deposit::first()->waste_bank_id);

        // Bank A harus mendapat list kosong
        $this->actingAs($officerA)
            ->getJson('/api/waste-bank/deposits')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_bank_a_cannot_see_bank_b_deposit_detail(): void
    {
        [$officerB, $bankB, $depositB] = $this->makeBankWithDeposit();
        [$officerA] = $this->makeBankWithDeposit();

        $this->actingAs($officerA)
            ->getJson("/api/waste-bank/deposits/{$depositB->id}")
            ->assertNotFound();
    }

    public function test_stats_only_reflect_own_bank_data(): void
    {
        // Buat bank B dengan deposit
        [$officerB, $bankB] = $this->makeBankWithDeposit();

        // Buat bank A tanpa deposit
        [$officerA, $bankA] = $this->makeBankWithDeposit();
        $bankA->deposits()->delete();

        // Stats bank A harus menunjukkan 0
        $this->actingAs($officerA)
            ->getJson('/api/waste-bank/stats')
            ->assertOk()
            ->assertJsonPath('data.deposits_today', 0)
            ->assertJsonPath('data.total_kg_today', 0);
    }
}
