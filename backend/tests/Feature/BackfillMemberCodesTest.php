<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\MemberCodeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class BackfillMemberCodesTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function backfill_fills_users_without_member_code(): void
    {
        // Buat user dengan member_code null (bypass model event dengan saveQuietly)
        $user = User::factory()->create(['member_code' => null]);
        // Hapus member_code yang mungkin terisi oleh event created
        $user->member_code = null;
        $user->saveQuietly();

        $this->artisan('members:backfill-codes')
            ->assertSuccessful()
            ->expectsOutputToContain('Berhasil mengisi 1 member_code.');

        $user->refresh();
        $this->assertNotNull($user->member_code);
        $this->assertSame(
            'GG-'.str_pad((string) $user->id, 6, '0', STR_PAD_LEFT),
            $user->member_code,
        );
    }

    #[Test]
    public function backfill_does_not_change_existing_codes(): void
    {
        $user = User::factory()->create();
        $originalCode = $user->member_code;

        $this->assertNotNull($originalCode);

        $this->artisan('members:backfill-codes')
            ->assertSuccessful();

        $user->refresh();
        $this->assertSame($originalCode, $user->member_code);
    }

    #[Test]
    public function backfill_reports_when_all_codes_exist(): void
    {
        User::factory()->create();

        $this->artisan('members:backfill-codes')
            ->assertSuccessful()
            ->expectsOutputToContain('Tidak ada yang perlu diisi.');
    }

    #[Test]
    public function backfill_only_affects_role_user(): void
    {
        // Waste bank user — tidak punya member_code, tidak boleh diisi
        $officer = User::factory()->wasteBank()->create();
        $officer->member_code = null;
        $officer->saveQuietly();

        $this->artisan('members:backfill-codes')
            ->assertSuccessful();

        $officer->refresh();
        $this->assertNull($officer->member_code);
    }

    #[Test]
    public function member_code_format_matches_spec(): void
    {
        $service = app(MemberCodeService::class);
        $user = User::factory()->create();

        $code = $service->generate($user);

        $this->assertSame('GG-'.str_pad((string) $user->id, 6, '0', STR_PAD_LEFT), $code);
        $this->assertMatchesRegularExpression('/^GG-\d{6}$/', $code);
    }
}
