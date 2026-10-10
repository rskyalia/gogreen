<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\WasteCategory;
use App\Models\WasteScan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WasteScan>
 */
class WasteScanFactory extends Factory
{
    protected $model = WasteScan::class;

    public function definition(): array
    {
        $score = fake()->numberBetween(0, 100);

        return [
            'user_id'           => User::factory(),
            'waste_category_id' => WasteCategory::factory(),
            'image_path'        => 'scans/' . fake()->uuid() . '.jpg',
            'object_name'       => fake()->randomElement([
                'Botol PET', 'Kardus', 'Kaleng Aluminium', 'Koran', 'Botol Kaca',
            ]),
            'material'          => fake()->randomElement([
                'PET', 'Cardboard', 'Aluminium', 'Paper', 'Glass',
            ]),
            'confidence'        => fake()->randomFloat(2, 50.00, 99.99),
            'green_score'       => $score,
            'recommended_path'  => fake()->randomElement(['diy', 'bank_sampah', 'both']),
            'raw_result'        => [
                'labels' => ['bottle', 'plastic'],
                'scores' => [0.95, 0.88],
                'model'  => 'go-green-v1',
            ],
        ];
    }
}
