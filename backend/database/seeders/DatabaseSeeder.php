<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Urutan penting — tabel dengan FK harus di-seed setelah dependency-nya:
     *   1. waste_categories  (tidak ada FK ke tabel custom)
     *   2. users             (tidak ada FK ke tabel custom)
     *   3. waste_banks       (FK ke users + waste_categories)
     *   4. diy_guides        (FK ke waste_categories + users)
     *   5. rewards           (FK ke users)
     */
    public function run(): void
    {
        $this->call([
            WasteCategorySeeder::class,  // 1
            UserSeeder::class,           // 2
            WasteBankSeeder::class,      // 3
            DiyGuideSeeder::class,       // 4
            RewardSeeder::class,         // 5
        ]);
    }
}
