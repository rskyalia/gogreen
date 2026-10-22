<?php

namespace Database\Factories;

use App\Models\DiyGuide;
use App\Models\User;
use App\Models\WasteCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DiyGuide>
 */
class DiyGuideFactory extends Factory
{
    protected $model = DiyGuide::class;

    public function definition(): array
    {
        return [
            'waste_category_id' => WasteCategory::factory(),
            'created_by'        => User::factory()->community(),
            'title'             => fake()->sentence(5),
            'description'       => fake()->paragraph(3),
            'difficulty'        => fake()->randomElement(['easy', 'medium', 'hard']),
            'estimated_minutes' => fake()->randomElement([15, 30, 45, 60, 90, 120]),
            'estimated_cost'    => fake()->numberBetween(0, 50_000),
            'materials'         => ['Lem', 'Gunting', 'Cat akrilik', 'Kuas'],
            'steps'             => [
                ['step' => 1, 'description' => 'Cuci dan keringkan material bekas.'],
                ['step' => 2, 'description' => 'Potong atau bentuk sesuai desain.'],
                ['step' => 3, 'description' => 'Rakit bagian-bagian dengan lem.'],
                ['step' => 4, 'description' => 'Cat dan beri finishing sesuai selera.'],
            ],
            'cover_image'   => null,
            'video_url'     => null,
            'reward_points' => fake()->randomElement([10, 20, 30, 50]),
            'is_published'  => false,
        ];
    }

    public function published(): static
    {
        return $this->state(fn () => ['is_published' => true]);
    }
}
