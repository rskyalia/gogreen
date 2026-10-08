<?php

namespace Database\Seeders;

use App\Models\GamificationSetting;
use Illuminate\Database\Seeder;

class GamificationSettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            [
                'action_type' => 'scan',
                'points'      => 5,
                'daily_limit' => 10,   // maks 50 poin/hari dari scan
                'is_active'   => true,
            ],
            [
                'action_type' => 'upcycle',
                'points'      => 20,
                'daily_limit' => 5,
                'is_active'   => true,
            ],
            [
                'action_type' => 'deposit',
                'points'      => 30,
                'daily_limit' => null,
                'is_active'   => true,
            ],
            [
                'action_type' => 'recycle_per_kg',
                'points'      => 50,
                'daily_limit' => null,
                'is_active'   => true,
            ],
            [
                'action_type' => 'achievement',
                'points'      => 0,    // poin achievement dikonfigurasikan per badge
                'daily_limit' => null,
                'is_active'   => true,
            ],
        ];

        foreach ($settings as $setting) {
            GamificationSetting::updateOrCreate(
                ['action_type' => $setting['action_type']],
                $setting
            );
        }
    }
}
