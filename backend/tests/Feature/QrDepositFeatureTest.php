<?php

namespace Tests\Feature;

use App\Models\Deposit;
use App\Models\DepositItem;
use App\Models\PointTransaction;
use App\Models\User;
use App\Models\WasteBank;
use App\Models\WasteCategory;
use App\Notifications\DepositRecorded;
use App\Services\PointService;
use App\Services\QrTokenService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Mockery\MockInterface;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class QrDepositFeatureTest extends TestCase
{
    use RefreshDatabase;

    // ── Fixtures ──────────────────────────────────────────────────────────

    private User $member;

    private User $officer;

    private WasteBank $wasteBank;

    private WasteCategory $petCategory;

    private WasteCategory $cardboardCategory;

    private QrTokenService $qrService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->qrService = app(QrTokenService::class);

        // Buat user (anggota)
        $this->member = User::factory()->create([
            'role' => 'user',
            'status' => 'active',
            'points_balance' => 0,
        ]);

        // Buat akun petugas
        $this->officer = User::factory()->create(['role' => 'waste_bank']);

        // Buat bank sampah verified dan hubungkan ke officer
        $this->wasteBank = WasteBank::factory()->verified()->create([
            'user_id' => $this->officer->id,
        ]);

        // Buat dua kategori dengan points_per_kg berbeda
        $this->petCategory = WasteCategory::factory()->create([
            'name' => 'Plastik PET',
            'slug' => 'plastik-pet-test',
            'points_per_kg' => 100,
            'is_active' => true,
        ]);
        $this->cardboardCategory = WasteCategory::factory()->create([
            'name' => 'Kardus',
            'slug' => 'kardus-test',
            'points_per_kg' => 50,
            'is_active' => true,
        ]);

        // Daftarkan kategori ke bank sampah
        $this->wasteBank->acceptedCategories()->sync([
            $this->petCategory->id,
            $this->cardboardCategory->id,
        ]);
    }

    // ── JALUR SUKSES ──────────────────────────────────────────────────────

    #[Test]
    public function happy_path_full_flow(): void
    {
        Notification::fake();

        // 1. User membuat token
        $tokenRes = $this->actingAs($this->member)
            ->postJson('/api/user/member-token');

        $tokenRes->assertStatus(200)
            ->assertJsonStructure(['data' => ['token', 'payload', 'expires_at']]);

        $token = $tokenRes->json('data.token');
        $payload = $tokenRes->json('data.payload');

        $this->assertEquals('gogreen://member/'.$token, $payload);
        $this->assertStringStartsWith('gogreen://member/', $payload);

        // 2. Petugas lookup dengan token → status menjadi claimed
        $lookupRes = $this->actingAs($this->officer)
            ->getJson('/api/waste-bank/members/lookup?token='.$token);

        $lookupRes->assertStatus(200)
            ->assertJsonStructure(['data' => ['id', 'name', 'member_code', 'avatar']])
            ->assertJsonMissing(['email'])
            ->assertJsonMissing(['phone']);

        // Verifikasi status token sekarang claimed
        $this->assertEquals('claimed', $this->qrService->status($token)['status']);
        $this->assertEquals($this->wasteBank->id, $this->qrService->status($token)['waste_bank_id']);

        // Petugas bisa lookup ulang token yang sama (re-claim oleh bank yang sama)
        $this->actingAs($this->officer)
            ->getJson('/api/waste-bank/members/lookup?token='.$token)
            ->assertStatus(200);

        // 3. Petugas menyimpan setoran: 2 kg PET + 1 kg Kardus
        $clientId = Str::uuid()->toString();

        $storeRes = $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'token' => $token,
                'client_request_id' => $clientId,
                'notes' => 'Setoran pagi',
                'items' => [
                    ['waste_category_id' => $this->petCategory->id, 'weight_kg' => 2.0],
                    ['waste_category_id' => $this->cardboardCategory->id, 'weight_kg' => 1.0],
                ],
            ]);

        $storeRes->assertStatus(201)
            ->assertJsonStructure(['data' => ['id', 'total_weight_kg', 'total_points', 'items']])
            ->assertJsonPath('data.total_weight_kg', 3.0)
            ->assertJsonPath('data.total_points', 250); // 2*100 + 1*50

        // 4a. Deposit dan deposit_items tersimpan
        $depositId = $storeRes->json('data.id');
        $deposit = Deposit::with('items')->findOrFail($depositId);

        $this->assertEquals($this->wasteBank->id, $deposit->waste_bank_id);
        $this->assertEquals($this->member->id, $deposit->user_id);
        $this->assertEquals($this->officer->id, $deposit->recorded_by); // recorded_by = petugas
        $this->assertCount(2, $deposit->items);

        // 4b. points_balance naik sesuai points_per_kg
        $this->member->refresh();
        $expectedPoints = (int) round(2 * 100 + 1 * 50); // = 250
        $this->assertEquals($expectedPoints, $this->member->points_balance);

        // 4c. point_transactions type=deposit dengan balance_after benar
        $pt = PointTransaction::where('user_id', $this->member->id)
            ->where('type', 'deposit')
            ->first();

        $this->assertNotNull($pt);
        $this->assertEquals($expectedPoints, $pt->points);
        $this->assertEquals($expectedPoints, $pt->balance_after);
        $this->assertEquals(Deposit::class, $pt->reference_type);
        $this->assertEquals($depositId, $pt->reference_id);

        // 4d. Notifikasi DepositRecorded dikirim ke member
        Notification::assertSentTo($this->member, DepositRecorded::class);

        // 4e. Status token menjadi used
        $this->assertEquals('used', $this->qrService->status($token)['status']);

        // 4f. /member-token/status mengembalikan ringkasan setoran
        $statusRes = $this->actingAs($this->member)
            ->getJson('/api/user/member-token/status?token='.$token);

        $statusRes->assertStatus(200)
            ->assertJsonPath('data.status', 'used')
            ->assertJsonStructure(['data' => ['status', 'deposit' => ['waste_bank_name', 'total_weight_kg', 'total_points', 'balance_after']]]);

        // 4g. Token tidak bisa dipakai lagi
        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'token' => $token,
                'client_request_id' => Str::uuid()->toString(),
                'items' => [
                    ['waste_category_id' => $this->petCategory->id, 'weight_kg' => 1.0],
                ],
            ])
            ->assertStatus(409)
            ->assertJsonPath('code', 'token_used');

        // 4h. Bank sampah lain tidak bisa melihat setoran ini
        $otherOfficer = User::factory()->create(['role' => 'waste_bank']);
        $otherBank = WasteBank::factory()->verified()->create(['user_id' => $otherOfficer->id]);

        $this->actingAs($otherOfficer)
            ->getJson('/api/waste-bank/deposits/'.$depositId)
            ->assertStatus(404);
    }

    // ── IDEMPOTENCY ───────────────────────────────────────────────────────

    #[Test]
    public function same_client_request_id_does_not_create_second_deposit(): void
    {
        $tokenData = $this->qrService->generate($this->member->id);
        $token = $tokenData['token'];
        $this->qrService->claim($token, $this->wasteBank->id);

        $clientId = Str::uuid()->toString();
        $payload = [
            'token' => $token,
            'client_request_id' => $clientId,
            'items' => [
                ['waste_category_id' => $this->petCategory->id, 'weight_kg' => 1.0],
            ],
        ];

        $res1 = $this->actingAs($this->officer)->postJson('/api/waste-bank/deposits', $payload);
        $res1->assertStatus(201);

        // Kedua kali dengan client_request_id yang sama harus mengembalikan deposit yang sama
        $res2 = $this->actingAs($this->officer)->postJson('/api/waste-bank/deposits', $payload);
        $res2->assertStatus(201)
            ->assertJsonPath('data.id', $res1->json('data.id'));

        // Hanya satu deposit yang tersimpan
        $this->assertEquals(1, Deposit::where('user_id', $this->member->id)->count());
        $this->assertDatabaseCount('deposit_items', 1);
        $this->assertDatabaseCount('point_transactions', 1);
        $this->assertDatabaseCount('notifications', 1);
    }

    #[Test]
    public function deposit_categories_only_returns_accepted_and_active_categories(): void
    {
        $inactive = WasteCategory::factory()->create(['is_active' => false, 'points_per_kg' => 10]);
        $this->wasteBank->acceptedCategories()->attach($inactive->id);

        $this->actingAs($this->officer)
            ->getJson('/api/waste-bank/deposit-categories')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonStructure([
                'data' => [['id', 'name', 'icon', 'points_per_kg']],
            ])
            ->assertJsonMissing(['id' => $inactive->id]);

        $ids = collect($this->actingAs($this->officer)
            ->getJson('/api/waste-bank/deposit-categories')
            ->json('data'))->pluck('id');

        $this->assertTrue($ids->contains($this->petCategory->id));
        $this->assertTrue($ids->contains($this->cardboardCategory->id));
    }

    // ── JALUR GAGAL ───────────────────────────────────────────────────────

    #[Test]
    public function expired_token_returns_422(): void
    {
        $this->actingAs($this->officer)
            ->getJson('/api/waste-bank/members/lookup?token='.Str::random(32))
            ->assertStatus(422)
            ->assertJsonPath('code', 'token_expired');
    }

    #[Test]
    public function used_token_returns_409(): void
    {
        $tokenData = $this->qrService->generate($this->member->id);
        $token = $tokenData['token'];
        $this->qrService->claim($token, $this->wasteBank->id);
        $this->qrService->markUsed($token, 999);

        $this->actingAs($this->officer)
            ->getJson('/api/waste-bank/members/lookup?token='.$token)
            ->assertStatus(409)
            ->assertJsonPath('code', 'token_used');
    }

    #[Test]
    public function token_claimed_by_other_bank_returns_409(): void
    {
        $otherOfficer = User::factory()->create(['role' => 'waste_bank']);
        $otherBank = WasteBank::factory()->verified()->create(['user_id' => $otherOfficer->id]);

        $tokenData = $this->qrService->generate($this->member->id);
        $token = $tokenData['token'];

        // Bank lain klaim duluan
        $this->qrService->claim($token, $otherBank->id);

        $this->actingAs($this->officer)
            ->getJson('/api/waste-bank/members/lookup?token='.$token)
            ->assertStatus(409)
            ->assertJsonPath('code', 'token_claimed_by_other');
    }

    #[Test]
    public function deposit_with_unclaimed_token_returns_422(): void
    {
        $token = $this->qrService->generate($this->member->id)['token'];

        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'token' => $token,
                'client_request_id' => Str::uuid()->toString(),
                'items' => [
                    ['waste_category_id' => $this->petCategory->id, 'weight_kg' => 1.0],
                ],
            ])
            ->assertStatus(422)
            ->assertJsonPath('code', 'token_invalid');

        $this->assertEquals(0, Deposit::count());
    }

    #[Test]
    public function malformed_token_returns_token_invalid(): void
    {
        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'token' => 'bukan-token',
                'client_request_id' => Str::uuid()->toString(),
                'items' => [
                    ['waste_category_id' => $this->petCategory->id, 'weight_kg' => 1.0],
                ],
            ])
            ->assertStatus(422)
            ->assertJsonPath('code', 'token_invalid')
            ->assertJsonStructure(['message', 'code', 'errors' => ['token']]);

        $this->assertEquals(0, Deposit::count());
    }

    #[Test]
    public function deposit_with_expired_claimed_token_returns_422(): void
    {
        $token = $this->qrService->generate($this->member->id)['token'];
        $this->qrService->claim($token, $this->wasteBank->id);

        // Simulasikan TTL habis.
        Cache::forget(QrTokenService::tokenKey($token));

        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'token' => $token,
                'client_request_id' => Str::uuid()->toString(),
                'items' => [
                    ['waste_category_id' => $this->petCategory->id, 'weight_kg' => 1.0],
                ],
            ])
            ->assertStatus(422)
            ->assertJsonPath('code', 'token_expired');

        $this->assertEquals(0, Deposit::count());
        $this->assertEquals(0, $this->member->fresh()->points_balance);
    }

    #[Test]
    public function deposit_with_token_claimed_by_other_bank_returns_409(): void
    {
        $otherOfficer = User::factory()->create(['role' => 'waste_bank']);
        $otherBank = WasteBank::factory()->verified()->create(['user_id' => $otherOfficer->id]);

        $token = $this->qrService->generate($this->member->id)['token'];
        $this->qrService->claim($token, $otherBank->id);

        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'token' => $token,
                'client_request_id' => Str::uuid()->toString(),
                'items' => [
                    ['waste_category_id' => $this->petCategory->id, 'weight_kg' => 1.0],
                ],
            ])
            ->assertStatus(409)
            ->assertJsonPath('code', 'token_claimed_by_other');

        $this->assertEquals(0, Deposit::count());
    }

    #[Test]
    public function banned_user_cannot_receive_deposit(): void
    {
        $token = $this->qrService->generate($this->member->id)['token'];
        $this->qrService->claim($token, $this->wasteBank->id);

        $this->member->update(['status' => 'banned']);

        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'token' => $token,
                'client_request_id' => Str::uuid()->toString(),
                'items' => [
                    ['waste_category_id' => $this->petCategory->id, 'weight_kg' => 1.0],
                ],
            ])
            ->assertStatus(403)
            ->assertJsonPath('code', 'user_banned');

        $this->assertEquals(0, Deposit::count());
        $this->assertEquals(0, $this->member->fresh()->points_balance);

        // Token tetap claimed agar bisa dicoba lagi setelah akun aktif kembali
        // atau hangus sendiri saat TTL berakhir.
        $this->assertEquals('claimed', $this->qrService->status($token)['status']);
    }

    #[Test]
    public function non_user_role_cannot_receive_deposit(): void
    {
        $community = User::factory()->create(['role' => 'community', 'member_code' => null]);

        $token = $this->qrService->generate($community->id)['token'];
        $this->qrService->claim($token, $this->wasteBank->id);

        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'token' => $token,
                'client_request_id' => Str::uuid()->toString(),
                'items' => [
                    ['waste_category_id' => $this->petCategory->id, 'weight_kg' => 1.0],
                ],
            ])
            ->assertStatus(404)
            ->assertJsonPath('code', 'user_not_found');

        $this->assertEquals(0, Deposit::count());
    }

    #[Test]
    public function mid_transaction_failure_rolls_back_all_rows(): void
    {
        $this->mock(PointService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('creditDeposit')
                ->once()
                ->andThrow(new \RuntimeException('forced failure'));
        });

        $token = $this->qrService->generate($this->member->id)['token'];
        $this->qrService->claim($token, $this->wasteBank->id);

        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'token' => $token,
                'client_request_id' => Str::uuid()->toString(),
                'items' => [
                    ['waste_category_id' => $this->petCategory->id, 'weight_kg' => 2.0],
                ],
            ])
            ->assertStatus(500);

        $this->assertEquals(0, Deposit::count());
        $this->assertEquals(0, DepositItem::count());
        $this->assertEquals(0, PointTransaction::count());
        $this->assertEquals(0, $this->member->fresh()->points_balance);

        // Token tidak boleh hangus bila transaksi gagal.
        $this->assertEquals('claimed', $this->qrService->status($token)['status']);
        $this->assertNull($this->qrService->getDepositId($token));
    }

    #[Test]
    public function user_notification_endpoints_return_and_mark_notifications(): void
    {
        $token = $this->qrService->generate($this->member->id)['token'];
        $this->qrService->claim($token, $this->wasteBank->id);

        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'token' => $token,
                'client_request_id' => Str::uuid()->toString(),
                'items' => [
                    ['waste_category_id' => $this->petCategory->id, 'weight_kg' => 2.0],
                ],
            ])
            ->assertCreated();

        $list = $this->actingAs($this->member)
            ->getJson('/api/user/notifications')
            ->assertOk()
            ->assertJsonPath('unread_count', 1)
            ->assertJsonStructure([
                'data' => [['id', 'type', 'data', 'read_at', 'created_at']],
            ]);

        $notificationId = $list->json('data.0.id');
        $this->assertSame('DepositRecorded', $list->json('data.0.type'));
        $this->assertSame($this->wasteBank->name, $list->json('data.0.data.waste_bank_name'));

        $this->actingAs($this->member)
            ->patchJson('/api/user/notifications/'.$notificationId.'/read')
            ->assertOk();

        $this->actingAs($this->member)
            ->getJson('/api/user/notifications')
            ->assertJsonPath('unread_count', 0);

        // Buat notifikasi kedua lalu uji read-all.
        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'member_code' => $this->member->member_code,
                'client_request_id' => Str::uuid()->toString(),
                'items' => [
                    ['waste_category_id' => $this->cardboardCategory->id, 'weight_kg' => 1.0],
                ],
            ])
            ->assertCreated();

        $this->actingAs($this->member)
            ->patchJson('/api/user/notifications/read-all')
            ->assertOk();

        $this->actingAs($this->member)
            ->getJson('/api/user/notifications')
            ->assertJsonPath('unread_count', 0);
    }

    #[Test]
    public function category_not_accepted_by_bank_returns_422(): void
    {
        $otherCategory = WasteCategory::factory()->create(['is_active' => true]);
        // Tidak di-sync ke bank ini

        $tokenData = $this->qrService->generate($this->member->id);
        $token = $tokenData['token'];
        $this->qrService->claim($token, $this->wasteBank->id);

        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'token' => $token,
                'client_request_id' => Str::uuid()->toString(),
                'items' => [
                    ['waste_category_id' => $otherCategory->id, 'weight_kg' => 1.0],
                ],
            ])
            ->assertStatus(422)
            ->assertJsonPath('code', 'category_not_accepted')
            ->assertJsonFragment(['items' => ['Beberapa kategori tidak diterima oleh bank sampah ini.']]);

        // Tidak ada deposit tersimpan
        $this->assertEquals(0, Deposit::count());
        // Saldo tidak berubah
        $this->assertEquals(0, $this->member->fresh()->points_balance);
    }

    #[Test]
    public function duplicate_category_in_items_returns_422(): void
    {
        $tokenData = $this->qrService->generate($this->member->id);
        $token = $tokenData['token'];
        $this->qrService->claim($token, $this->wasteBank->id);

        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'token' => $token,
                'client_request_id' => Str::uuid()->toString(),
                'items' => [
                    ['waste_category_id' => $this->petCategory->id, 'weight_kg' => 1.0],
                    ['waste_category_id' => $this->petCategory->id, 'weight_kg' => 2.0],
                ],
            ])
            ->assertStatus(422)
            ->assertJsonPath('code', 'validation_error');

        $this->assertEquals(0, Deposit::count());
    }

    #[Test]
    public function weight_zero_or_negative_returns_422(): void
    {
        $tokenData = $this->qrService->generate($this->member->id);
        $token = $tokenData['token'];
        $this->qrService->claim($token, $this->wasteBank->id);

        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'token' => $token,
                'client_request_id' => Str::uuid()->toString(),
                'items' => [
                    ['waste_category_id' => $this->petCategory->id, 'weight_kg' => 0],
                ],
            ])
            ->assertStatus(422)
            ->assertJsonPath('code', 'validation_error');

        $this->assertEquals(0, Deposit::count());
    }

    #[Test]
    public function weight_above_500_returns_422(): void
    {
        $tokenData = $this->qrService->generate($this->member->id);
        $token = $tokenData['token'];
        $this->qrService->claim($token, $this->wasteBank->id);

        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'token' => $token,
                'client_request_id' => Str::uuid()->toString(),
                'items' => [
                    ['waste_category_id' => $this->petCategory->id, 'weight_kg' => 500.01],
                ],
            ])
            ->assertStatus(422)
            ->assertJsonPath('code', 'validation_error');
    }

    #[Test]
    public function banned_user_cannot_deposit(): void
    {
        $this->member->update(['status' => 'banned']);

        $tokenData = $this->qrService->generate($this->member->id);
        $token = $tokenData['token'];

        $this->actingAs($this->officer)
            ->getJson('/api/waste-bank/members/lookup?token='.$token)
            ->assertStatus(403)
            ->assertJsonPath('code', 'user_banned');
    }

    #[Test]
    public function unverified_bank_cannot_access_deposit_routes(): void
    {
        $unverifiedOfficer = User::factory()->create(['role' => 'waste_bank']);
        WasteBank::factory()->create(['user_id' => $unverifiedOfficer->id]); // pending

        $this->actingAs($unverifiedOfficer)
            ->getJson('/api/waste-bank/members/lookup?token='.Str::random(32))
            ->assertStatus(403)
            ->assertJsonPath('code', 'bank_not_verified');

        $this->actingAs($unverifiedOfficer)
            ->postJson('/api/waste-bank/deposits', [
                'member_code' => $this->member->member_code,
                'client_request_id' => Str::uuid()->toString(),
                'items' => [
                    ['waste_category_id' => $this->petCategory->id, 'weight_kg' => 1.0],
                ],
            ])
            ->assertStatus(403)
            ->assertJsonPath('code', 'bank_not_verified');
    }

    #[Test]
    public function token_status_only_visible_to_owner(): void
    {
        $tokenData = $this->qrService->generate($this->member->id);
        $token = $tokenData['token'];

        $otherUser = User::factory()->create(['role' => 'user']);

        // Spec: token milik user lain → 404 (tidak bocorkan keberadaannya)
        $this->actingAs($otherUser)
            ->getJson('/api/user/member-token/status?token='.$token)
            ->assertStatus(404)
            ->assertJsonPath('data.status', null)
            ->assertJsonPath('code', 'token_invalid');
    }

    #[Test]
    public function concurrent_lookup_only_one_succeeds(): void
    {
        // Simulasi dua bank mencoba klaim token yang sama
        // Dalam test sequential, hanya verifikasi bahwa klaim kedua ditolak
        $otherOfficer = User::factory()->create(['role' => 'waste_bank']);
        $otherBank = WasteBank::factory()->verified()->create(['user_id' => $otherOfficer->id]);

        $tokenData = $this->qrService->generate($this->member->id);
        $token = $tokenData['token'];

        // Bank pertama berhasil klaim
        $first = $this->qrService->claim($token, $this->wasteBank->id);
        $this->assertTrue($first['success']);

        // Bank kedua gagal
        $second = $this->qrService->claim($token, $otherBank->id);
        $this->assertFalse($second['success']);
        $this->assertEquals('token_claimed_by_other', $second['code']);
    }

    #[Test]
    public function lookup_does_not_expose_email_or_phone(): void
    {
        $tokenData = $this->qrService->generate($this->member->id);
        $token = $tokenData['token'];

        $res = $this->actingAs($this->officer)
            ->getJson('/api/waste-bank/members/lookup?token='.$token);

        $res->assertStatus(200);

        $data = $res->json('data');
        $this->assertArrayNotHasKey('email', $data);
        $this->assertArrayNotHasKey('phone', $data);
        $this->assertArrayHasKey('id', $data);
        $this->assertArrayHasKey('name', $data);
        $this->assertArrayHasKey('member_code', $data);
    }

    #[Test]
    public function transaction_rollback_leaves_no_data_and_no_balance_change(): void
    {
        // Paksa error di tengah transaksi dengan kategori tidak valid
        $tokenData = $this->qrService->generate($this->member->id);
        $token = $tokenData['token'];
        $this->qrService->claim($token, $this->wasteBank->id);

        $this->actingAs($this->officer)
            ->postJson('/api/waste-bank/deposits', [
                'token' => $token,
                'client_request_id' => Str::uuid()->toString(),
                'items' => [
                    // Kategori tidak diterima bank ini
                    ['waste_category_id' => 99999, 'weight_kg' => 1.0],
                ],
            ])
            ->assertStatus(422);

        $this->assertEquals(0, Deposit::count());
        $this->assertEquals(0, PointTransaction::count());
        $this->assertEquals(0, $this->member->fresh()->points_balance);

        // Token TETAP claimed (tidak di-reset saat gagal)
        $this->assertEquals('claimed', $this->qrService->status($token)['status']);
    }

    #[Test]
    public function member_lookup_is_rate_limited_per_officer(): void
    {
        $tokenData = $this->qrService->generate($this->member->id);
        $token = $tokenData['token'];

        // 30 lookup pertama masih dalam batas (lookup ulang oleh bank yang sama).
        for ($i = 0; $i < 30; $i++) {
            $this->actingAs($this->officer)
                ->getJson('/api/waste-bank/members/lookup?token='.$token)
                ->assertStatus(200);
        }

        $this->actingAs($this->officer)
            ->getJson('/api/waste-bank/members/lookup?token='.$token)
            ->assertStatus(429)
            ->assertJsonPath('code', 'rate_limited');
    }
}
