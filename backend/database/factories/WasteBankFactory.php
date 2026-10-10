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
        // Koordinat acak di sekitar Jabodetabek
        $lat = fake()->randomFloat(7, -6.45, -6.10);
        $lng = fake()->randomFloat(7, 106.70, 107.00);

        return [
            'user_id'             => User::factory()->wasteBank(),
            'name'                => 'Bank Sampah ' . fake()->lastName(),
            'address'             => fake()->address(),
            'latitude'            => $lat,
            'longitude'           => $lng,
            'phone'               => fake()->phoneNumber(),
            'description'         => fake()->paragraph(),
            'opening_hours'       => [
                'senin'   => '08:00-17:00',
                'selasa'  => '08:00-17:00',
                'rabu'    => '08:00-17:00',
                'kamis'   => '08:00-17:00',
                'jumat'   => '08:00-15:00',
                'sabtu'   => '08:00-12:00',
                'minggu'  => 'Tutup',
            ],
            'is_open'             => true,
            'verification_status' => 'pending',
            'verified_by'         => null,
            'verified_at'         => null,
        ];
    }

    public function verified(): static
    {
        return $this->state(fn () => [
            'verification_status' => 'verified',
            'verified_at'         => now(),
        ]);
    }
}
