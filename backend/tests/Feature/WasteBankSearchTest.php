<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WasteBank;
use App\Models\WasteCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WasteBankSearchTest extends TestCase
{
    use RefreshDatabase;

    private User $member;

    private WasteCategory $categoryA;

    private WasteCategory $categoryB;

    // Koordinat tengah — digunakan sebagai titik referensi
    // (sekitar Jakarta Pusat)
    private const LAT = -6.2000;

    private const LNG = 106.8167;

    protected function setUp(): void
    {
        parent::setUp();

        $this->member = User::factory()->create();
        $this->categoryA = WasteCategory::factory()->create(['name' => 'Plastik']);
        $this->categoryB = WasteCategory::factory()->create(['name' => 'Kertas']);
    }

    // ── Helper: buat bank verified dekat koordinat tengah ────────────────

    private function makeBank(array $overrides = []): WasteBank
    {
        $officer = User::factory()->wasteBank()->create();
        $bank = WasteBank::factory()->verified()->create(array_merge(
            ['user_id' => $officer->id],
            $overrides,
        ));

        return $bank;
    }

    // ── Hanya verified yang muncul ────────────────────────────────────────

    public function test_only_verified_banks_appear(): void
    {
        $verified = $this->makeBank(['latitude' => self::LAT, 'longitude' => self::LNG]);

        $officerPending = User::factory()->wasteBank()->create();
        WasteBank::factory()->create([
            'user_id' => $officerPending->id,
            'latitude' => self::LAT,
            'longitude' => self::LNG,
            'verification_status' => 'pending',
        ]);

        $this->actingAs($this->member)
            ->getJson('/api/user/waste-banks')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $verified->id);
    }

    // ── Filter kategori ───────────────────────────────────────────────────

    public function test_category_filter_excludes_banks_not_accepting_it(): void
    {
        $bankA = $this->makeBank(['latitude' => self::LAT, 'longitude' => self::LNG]);
        $bankB = $this->makeBank(['latitude' => self::LAT, 'longitude' => self::LNG]);

        $bankA->acceptedCategories()->attach($this->categoryA->id);
        $bankB->acceptedCategories()->attach($this->categoryB->id);

        $this->actingAs($this->member)
            ->getJson('/api/user/waste-banks?category_id='.$this->categoryA->id)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $bankA->id);
    }

    public function test_no_category_filter_returns_all_verified(): void
    {
        $this->makeBank(['latitude' => self::LAT, 'longitude' => self::LNG]);
        $this->makeBank(['latitude' => self::LAT, 'longitude' => self::LNG]);

        $this->actingAs($this->member)
            ->getJson('/api/user/waste-banks')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    // ── Filter open_now ───────────────────────────────────────────────────

    public function test_open_now_filter_excludes_closed_banks(): void
    {
        $openBank = $this->makeBank([
            'latitude' => self::LAT,
            'longitude' => self::LNG,
            'is_open' => true,
            'opening_hours' => [
                'senin' => '00:00-23:59', 'selasa' => '00:00-23:59',
                'rabu' => '00:00-23:59', 'kamis' => '00:00-23:59',
                'jumat' => '00:00-23:59', 'sabtu' => '00:00-23:59',
                'minggu' => '00:00-23:59',
            ],
        ]);

        $closedBank = $this->makeBank([
            'latitude' => self::LAT,
            'longitude' => self::LNG,
            'is_open' => false,
        ]);

        $this->actingAs($this->member)
            ->getJson('/api/user/waste-banks?open_now=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $openBank->id);
    }

    // ── Urutan jarak ──────────────────────────────────────────────────────

    public function test_results_ordered_by_distance_ascending(): void
    {
        // Bank jauh: ~5 km dari titik acuan
        $farBank = $this->makeBank([
            'latitude' => self::LAT - 0.045,  // sekitar 5 km ke selatan
            'longitude' => self::LNG,
        ]);

        // Bank dekat: ~1 km dari titik acuan
        $nearBank = $this->makeBank([
            'latitude' => self::LAT - 0.009,  // sekitar 1 km ke selatan
            'longitude' => self::LNG,
        ]);

        $response = $this->actingAs($this->member)
            ->getJson(sprintf(
                '/api/user/waste-banks?lat=%s&lng=%s&radius_km=50',
                self::LAT,
                self::LNG,
            ))
            ->assertOk();

        $ids = array_column($response->json('data'), 'id');
        $this->assertSame($nearBank->id, $ids[0], 'Bank terdekat harus muncul pertama');
        $this->assertSame($farBank->id, $ids[1]);
    }

    public function test_distance_km_field_is_returned_when_coords_given(): void
    {
        $this->makeBank(['latitude' => self::LAT, 'longitude' => self::LNG]);

        $response = $this->actingAs($this->member)
            ->getJson(sprintf('/api/user/waste-banks?lat=%s&lng=%s', self::LAT, self::LNG))
            ->assertOk();

        $distKm = $response->json('data.0.distance_km');
        $this->assertNotNull($distKm);
        // JSON tidak membedakan int 0 dan float 0.0; cukup pastikan numerik
        $this->assertIsNumeric($distKm);
    }

    public function test_distance_km_is_null_without_coords(): void
    {
        $this->makeBank(['latitude' => self::LAT, 'longitude' => self::LNG]);

        $this->actingAs($this->member)
            ->getJson('/api/user/waste-banks')
            ->assertOk()
            ->assertJsonPath('data.0.distance_km', null);
    }

    // ── Filter radius ─────────────────────────────────────────────────────

    public function test_bank_outside_radius_is_excluded(): void
    {
        // Bank ~55 km ke selatan — di luar radius default 10 km
        $this->makeBank([
            'latitude' => self::LAT - 0.5,
            'longitude' => self::LNG,
        ]);

        $this->actingAs($this->member)
            ->getJson(sprintf(
                '/api/user/waste-banks?lat=%s&lng=%s&radius_km=10',
                self::LAT,
                self::LNG,
            ))
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    // ── Detail endpoint ───────────────────────────────────────────────────

    public function test_show_returns_full_detail(): void
    {
        $bank = $this->makeBank(['latitude' => self::LAT, 'longitude' => self::LNG]);
        $bank->acceptedCategories()->attach($this->categoryA->id);

        $this->actingAs($this->member)
            ->getJson('/api/user/waste-banks/'.$bank->id)
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'id', 'name', 'address', 'latitude', 'longitude',
                    'phone', 'description', 'is_open', 'is_open_now',
                    'today_hours', 'opening_hours', 'accepted_categories',
                ],
            ])
            ->assertJsonPath('data.accepted_categories.0.id', $this->categoryA->id);
    }

    public function test_show_pending_bank_returns_404(): void
    {
        $officerPending = User::factory()->wasteBank()->create();
        $pending = WasteBank::factory()->create([
            'user_id' => $officerPending->id,
            'verification_status' => 'pending',
        ]);

        $this->actingAs($this->member)
            ->getJson('/api/user/waste-banks/'.$pending->id)
            ->assertNotFound();
    }

    // ── Keamanan ─────────────────────────────────────────────────────────

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/user/waste-banks')->assertUnauthorized();
    }

    public function test_response_does_not_expose_sensitive_fields(): void
    {
        $this->makeBank(['latitude' => self::LAT, 'longitude' => self::LNG]);

        $this->actingAs($this->member)
            ->getJson('/api/user/waste-banks')
            ->assertOk()
            ->assertJsonMissingPath('data.0.user_id')
            ->assertJsonMissingPath('data.0.verified_by')
            ->assertJsonMissingPath('data.0.verification_status');
    }
}
