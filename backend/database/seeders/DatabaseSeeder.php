<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     * Urutan penting: tabel independen dulu, lalu yang bergantung pada FK.
     */
    public function run(): void
    {
        $this->call([
            // 1. Master data tanpa FK
            WasteCategorySeeder::class,
            GamificationSettingSeeder::class,
            AchievementSeeder::class,

            // 2. Users (citizen, waste_bank, admin)
            UserSeeder::class,

            // 3. Data bergantung pada users + categories
            WasteBankSeeder::class,
            UpcyclingIdeaSeeder::class,
        ]);
    }
}
