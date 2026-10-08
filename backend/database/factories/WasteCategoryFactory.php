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
            'Plastik', 'Kertas', 'Kaca', 'Logam', 'Organik', 'Elektronik',
        ]);

        return [
            'name'          => $name,
            'slug'          => Str::slug($name),
            'description'   => fake()->sentence(),
            'is_recyclable' => true,
            'icon'          => null,
        ];
    }
}
