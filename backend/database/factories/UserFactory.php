<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'name'              => fake()->name(),
            'email'             => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password'          => Hash::make('password'),
            'role'              => 'user',
            'phone'             => fake()->phoneNumber(),
            'avatar'            => null,
            // member_code di-generate otomatis oleh model boot untuk role=user
            'member_code'       => null,
            'points_balance'    => 0,
            'status'            => 'active',
            'banned_reason'     => null,
            'remember_token'    => Str::random(10),
        ];
    }

    // ── States ────────────────────────────────────────────────────────────

    public function developer(): static
    {
        return $this->state(fn () => [
            'role'        => 'developer',
            'member_code' => null, // developer tidak pakai member_code
        ]);
    }

    public function wasteBank(): static
    {
        return $this->state(fn () => [
            'role'        => 'waste_bank',
            'member_code' => null,
        ]);
    }

    public function community(): static
    {
        return $this->state(fn () => [
            'role'        => 'community',
            'member_code' => null,
        ]);
    }

    public function banned(): static
    {
        return $this->state(fn () => [
            'status'        => 'banned',
            'banned_reason' => 'Melanggar ketentuan layanan.',
        ]);
    }

    public function withPoints(int $points): static
    {
        return $this->state(fn () => ['points_balance' => $points]);
    }
}
