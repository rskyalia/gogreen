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
            'role'              => 'citizen',
            'phone'             => fake()->phoneNumber(),
            'avatar'            => null,
            'total_points'      => fake()->numberBetween(0, 500),
            'is_active'         => true,
            'remember_token'    => Str::random(10),
        ];
    }

    public function admin(): static
    {
        return $this->state(fn () => [
            'role'  => 'admin',
            'email' => 'admin@gogreen.id',
            'name'  => 'Super Admin',
        ]);
    }

    public function wasteBank(): static
    {
        return $this->state(fn () => ['role' => 'waste_bank']);
    }

    public function citizen(): static
    {
        return $this->state(fn () => ['role' => 'citizen']);
    }

    public function unverified(): static
    {
        return $this->state(fn () => ['email_verified_at' => null]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
