<?php

namespace Tests\Unit;

use App\Exceptions\ApiException;
use App\Models\User;
use App\Services\QrTokenService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Tes unit untuk metode baru QrTokenService: issue, inspect, release,
 * consume, statusFor.
 */
class QrTokenServiceTest extends TestCase
{
    use RefreshDatabase;

    private QrTokenService $service;

    private User $member;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = app(QrTokenService::class);
        $this->member = User::factory()->create();
    }

    // ── issue ──────────────────────────────────────────────────────────────

    #[Test]
    public function issue_creates_token_with_correct_format(): void
    {
        $data = $this->service->issue($this->member);

        $this->assertSame(32, strlen($data['token']));
        $this->assertSame('gogreen://member/'.$data['token'], $data['payload']);
        $this->assertNotEmpty($data['expires_at']);
    }

    #[Test]
    public function issue_revokes_old_active_token(): void
    {
        $first = $this->service->issue($this->member);
        $second = $this->service->issue($this->member);

        $this->assertNull($this->service->get($first['token']));
        $this->assertNotNull($this->service->get($second['token']));
    }

    #[Test]
    public function issue_throws_token_in_process_when_claimed(): void
    {
        $data = $this->service->issue($this->member);
        $this->service->claim($data['token'], 1);

        $this->expectException(ApiException::class);

        try {
            $this->service->issue($this->member);
        } catch (ApiException $e) {
            $this->assertSame('token_in_process', $e->errorCode);
            $this->assertSame(409, $e->status);
            throw $e;
        }
    }

    // ── inspect ────────────────────────────────────────────────────────────

    #[Test]
    public function inspect_returns_payload_for_active_token(): void
    {
        $data = $this->service->issue($this->member);

        $payload = $this->service->inspect($data['token']);

        $this->assertSame($this->member->id, $payload['user_id']);
        $this->assertSame('active', $payload['status']);
    }

    #[Test]
    public function inspect_throws_token_expired_for_missing_token(): void
    {
        $this->expectException(ApiException::class);

        try {
            $this->service->inspect(str_repeat('x', 32));
        } catch (ApiException $e) {
            $this->assertSame('token_expired', $e->errorCode);
            throw $e;
        }
    }

    #[Test]
    public function inspect_throws_token_used_for_consumed_token(): void
    {
        $data = $this->service->issue($this->member);
        $this->service->claim($data['token'], 1);
        $this->service->consume($data['token'], 1, [
            'deposit_id' => 42,
            'waste_bank_name' => 'Bank Test',
            'total_weight_kg' => 2.5,
            'total_points' => 25,
            'balance_after' => 100,
        ]);

        $this->expectException(ApiException::class);

        try {
            $this->service->inspect($data['token']);
        } catch (ApiException $e) {
            $this->assertSame('token_used', $e->errorCode);
            throw $e;
        }
    }

    // ── release ────────────────────────────────────────────────────────────

    #[Test]
    public function release_by_owner_returns_to_active(): void
    {
        $data = $this->service->issue($this->member);
        $this->service->claim($data['token'], 1);

        $result = $this->service->release($data['token'], 1);

        $this->assertTrue($result['success']);
        $this->assertSame('active', $this->service->status($data['token'])['status']);
    }

    #[Test]
    public function release_by_non_owner_fails(): void
    {
        $data = $this->service->issue($this->member);
        $this->service->claim($data['token'], 1);

        $result = $this->service->release($data['token'], 999);

        $this->assertFalse($result['success']);
        $this->assertSame('token_claimed_by_other', $result['code']);
        // Token tetap claimed
        $this->assertSame('claimed', $this->service->status($data['token'])['status']);
    }

    #[Test]
    public function release_expired_token_fails(): void
    {
        $result = $this->service->release(str_repeat('y', 32), 1);

        $this->assertFalse($result['success']);
        $this->assertSame('token_expired', $result['code']);
    }

    #[Test]
    public function release_used_token_fails(): void
    {
        $data = $this->service->issue($this->member);
        $this->service->claim($data['token'], 1);
        $this->service->consume($data['token'], 1, [
            'deposit_id' => 1,
            'waste_bank_name' => 'Bank',
            'total_weight_kg' => 1.0,
            'total_points' => 10,
            'balance_after' => 10,
        ]);

        $result = $this->service->release($data['token'], 1);

        $this->assertFalse($result['success']);
        $this->assertSame('token_used', $result['code']);
    }

    // ── consume ────────────────────────────────────────────────────────────

    #[Test]
    public function consume_sets_used_and_stores_summary(): void
    {
        $data = $this->service->issue($this->member);
        $this->service->claim($data['token'], 1);

        $summary = [
            'deposit_id' => 42,
            'waste_bank_name' => 'Bank Sehat',
            'total_weight_kg' => 3.5,
            'total_points' => 35,
            'balance_after' => 135,
        ];

        $this->service->consume($data['token'], 1, $summary);

        // Token tidak ada lagi di qr:{token}
        $this->assertNull($this->service->get($data['token']));

        // Status menjadi used
        $this->assertSame('used', $this->service->status($data['token'])['status']);

        // Ringkasan tersimpan di qr_used
        $stored = $this->service->getUsedSummary($data['token']);
        $this->assertNotNull($stored);
        $this->assertSame($this->member->id, $stored['user_id']);
        $this->assertSame(42, $stored['deposit_id']);
        $this->assertSame('Bank Sehat', $stored['waste_bank_name']);
        $this->assertSame(3.5, $stored['total_weight_kg']);
        $this->assertSame(35, $stored['total_points']);
        $this->assertSame(135, $stored['balance_after']);
    }

    #[Test]
    public function consume_by_non_holder_throws_token_claimed_by_other(): void
    {
        $data = $this->service->issue($this->member);
        $this->service->claim($data['token'], 1);

        $this->expectException(ApiException::class);

        try {
            $this->service->consume($data['token'], 999, [
                'deposit_id' => 1,
                'waste_bank_name' => 'Other',
                'total_weight_kg' => 1.0,
                'total_points' => 10,
                'balance_after' => 10,
            ]);
        } catch (ApiException $e) {
            $this->assertSame('token_claimed_by_other', $e->errorCode);
            $this->assertSame(409, $e->status);
            throw $e;
        }
    }

    #[Test]
    public function consume_unclaimed_token_throws_token_invalid(): void
    {
        $data = $this->service->issue($this->member);

        $this->expectException(ApiException::class);

        try {
            $this->service->consume($data['token'], 1, [
                'deposit_id' => 1,
                'waste_bank_name' => 'Bank',
                'total_weight_kg' => 1.0,
                'total_points' => 10,
                'balance_after' => 10,
            ]);
        } catch (ApiException $e) {
            $this->assertSame('token_invalid', $e->errorCode);
            throw $e;
        }
    }

    #[Test]
    public function consume_expired_token_throws_token_expired(): void
    {
        $this->expectException(ApiException::class);

        try {
            $this->service->consume(str_repeat('z', 32), 1, [
                'deposit_id' => 1,
                'waste_bank_name' => 'Bank',
                'total_weight_kg' => 1.0,
                'total_points' => 10,
                'balance_after' => 10,
            ]);
        } catch (ApiException $e) {
            $this->assertSame('token_expired', $e->errorCode);
            throw $e;
        }
    }

    // ── statusFor ──────────────────────────────────────────────────────────

    #[Test]
    public function status_for_returns_status_for_owner(): void
    {
        $data = $this->service->issue($this->member);

        $status = $this->service->statusFor($data['token'], $this->member);

        $this->assertSame('active', $status['status']);
    }

    #[Test]
    public function status_for_throws_for_other_user_token(): void
    {
        $data = $this->service->issue($this->member);
        $otherUser = User::factory()->create();

        $this->expectException(ApiException::class);

        try {
            $this->service->statusFor($data['token'], $otherUser);
        } catch (ApiException $e) {
            $this->assertSame('token_invalid', $e->errorCode);
            $this->assertSame(404, $e->status);
            throw $e;
        }
    }

    #[Test]
    public function status_for_returns_claimed_with_waste_bank_id(): void
    {
        $data = $this->service->issue($this->member);
        $this->service->claim($data['token'], 5);

        $status = $this->service->statusFor($data['token'], $this->member);

        $this->assertSame('claimed', $status['status']);
        $this->assertSame(5, $status['waste_bank_id']);
    }
}
