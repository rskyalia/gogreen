<?php

namespace Database\Factories;

use App\Models\Deposit;
use App\Models\User;
use App\Models\WasteBank;
use App\Models\WasteCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Deposit>
 */
class DepositFactory extends Factory
{
    protected $model = Deposit::class;

    public function definition(): array
    {
        return [
            'user_id'              => User::factory(),
            'waste_bank_id'        => WasteBank::factory(),
            'waste_category_id'    => WasteCategory::factory(),
            'estimated_weight_kg'  => fake()->randomFloat(3, 0.5, 20),
            'verified_weight_kg'   => null,
            'status'               => 'pending',
            'notes'                => fake()->optional()->sentence(),
            'proof_image'          => null,
            'verified_by'          => null,
            'verified_at'          => null,
        ];
    }

    public function completed(): static
    {
        return $this->state(fn () => [
            'status'              => 'completed',
            'verified_weight_kg'  => fake()->randomFloat(3, 0.5, 20),
            'verified_at'         => now(),
        ]);
    }
}
