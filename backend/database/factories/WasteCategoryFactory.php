<?php

namespace Database\Factories;

use App\Models\WasteCategory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<WasteCategory>
 */
class WasteCategoryFactory extends Factory
{
    protected $model = WasteCategory::class;

    public function definition(): array
    {
        $name = fake()->unique()->randomElement([
            'Plastik PET', 'Kardus', 'Kaleng', 'Kaca',
            'Organik', 'Kertas', 'Elektronik', 'Tekstil',
        ]);

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => fake()->sentence(),
            'is_recyclable' => true,
            'is_upcyclable' => true,
            'points_per_kg' => fake()->randomElement([10, 20, 30, 50]),
            'icon' => null,
            'is_active' => true,
        ];
    }
}
