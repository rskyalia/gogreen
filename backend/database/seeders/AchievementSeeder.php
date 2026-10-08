<?php

namespace Database\Seeders;

use App\Models\Achievement;
use Illuminate\Database\Seeder;

class AchievementSeeder extends Seeder
{
    public function run(): void
    {
        $achievements = [
            [
                'code'            => 'first_scan',
                'name'            => 'First Scan',
                'description'     => 'Lakukan pemindaian sampah pertamamu dan mulai perjalanan hijaumu!',
                'icon'            => '🔍',
                'criteria_type'   => 'scan_count',
                'criteria_value'  => 1,
            ],
            [
                'code'            => 'eco_explorer',
                'name'            => 'Eco Explorer',
                'description'     => 'Telah melakukan 10 pemindaian sampah. Kamu semakin paham tentang sampah di sekitarmu.',
                'icon'            => '🌱',
                'criteria_type'   => 'scan_count',
                'criteria_value'  => 10,
            ],
            [
                'code'            => 'reuse_builder',
                'name'            => 'Reuse Builder',
                'description'     => 'Berhasil menyelesaikan 5 proyek upcycling. Kreativitasmu menyelamatkan lingkungan!',
                'icon'            => '🔨',
                'criteria_type'   => 'upcycle_count',
                'criteria_value'  => 5,
            ],
            [
                'code'            => 'green_architect',
                'name'            => 'Green Architect',
                'description'     => 'Telah menyelamatkan 25 kg sampah dari tempat pembuangan akhir.',
                'icon'            => '🏗️',
                'criteria_type'   => 'waste_diverted_kg',
                'criteria_value'  => 25,
            ],
            [
                'code'            => 'architect_of_change',
                'name'            => 'Architect of Change',
                'description'     => 'Mengumpulkan total 1.000 poin. Kamu adalah agen perubahan nyata untuk lingkungan!',
                'icon'            => '🏆',
                'criteria_type'   => 'points_total',
                'criteria_value'  => 1000,
            ],
        ];

        foreach ($achievements as $achievement) {
            Achievement::updateOrCreate(
                ['code' => $achievement['code']],
                $achievement
            );
        }
    }
}
