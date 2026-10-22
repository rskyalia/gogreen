<?php

namespace Database\Factories;

use App\Models\Reward;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Reward>
 */
class RewardFactory extends Factory
{
    protected $model = Reward::class;

    public function definition(): array
    {
        return [
            'name'        => fake()->randomElement([
                'Voucher Belanja Rp10.000',
                'Bibit Tanaman Gratis',
                'Tote Bag Ramah Lingkungan',
                'Tumbler Stainless',
                'Voucher Kopi',
            ]),
            'description' => fake()->paragraph(),
            'image'       => null,
            'points_cost' => fake()->randomElement([50, 100, 150, 200, 300]),
            'stock'       => fake()->optional(0.7)->numberBetween(5, 50),
            'is_active'   => true,
            'created_by'  => User::factory()->developer(),
        ];
    }
}
