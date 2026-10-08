<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\WasteBank;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WasteBank>
 */
class WasteBankFactory extends Factory
{
    protected $model = WasteBank::class;

    public function definition(): array
    {
        // Koordinat sekitar Jabodetabek
        $lat = fake()->randomFloat(7, -6.4, -6.1);
        $lng = fake()->randomFloat(7, 106.7, 107.0);

        return [
            'user_id'         => User::factory()->wasteBank(),
            'name'            => 'Bank Sampah ' . fake()->lastName(),
            'address'         => fake()->address(),
            'latitude'        => $lat,
            'longitude'       => $lng,
            'phone'           => fake()->phoneNumber(),
            'operating_hours' => [
                'senin'  => '08:00-17:00',
                'selasa' => '08:00-17:00',
                'rabu'   => '08:00-17:00',
                'kamis'  => '08:00-17:00',
                'jumat'  => '08:00-15:00',
                'sabtu'  => '08:00-12:00',
                'minggu' => 'Tutup',
            ],
            'description' => fake()->paragraph(),
            'is_active'   => true,
            'is_verified' => false,
        ];
    }

    public function verified(): static
    {
        return $this->state(fn () => ['is_verified' => true]);
    }
}
