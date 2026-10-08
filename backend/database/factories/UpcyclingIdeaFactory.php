<?php

namespace Database\Factories;

use App\Models\UpcyclingIdea;
use App\Models\WasteCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UpcyclingIdea>
 */
class UpcyclingIdeaFactory extends Factory
{
    protected $model = UpcyclingIdea::class;

    public function definition(): array
    {
        return [
            'waste_category_id'    => WasteCategory::factory(),
            'title'                => fake()->sentence(4),
            'description'          => fake()->paragraph(),
            'difficulty'           => fake()->randomElement(['easy', 'medium', 'hard']),
            'estimated_minutes'    => fake()->randomElement([15, 30, 45, 60, 90, 120]),
            'estimated_cost'       => fake()->numberBetween(0, 50000),
            'additional_materials' => ['Lem', 'Cat', 'Gunting'],
            'tutorial_steps'       => [
                ['step' => 1, 'description' => 'Bersihkan material'],
                ['step' => 2, 'description' => 'Potong sesuai pola'],
                ['step' => 3, 'description' => 'Rakit dan finishing'],
            ],
            'video_url'            => null,
            'image'                => null,
            'impact_kg'            => fake()->randomFloat(3, 0.1, 5.0),
            'is_active'            => true,
        ];
    }
}
