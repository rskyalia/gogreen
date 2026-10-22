<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\WasteBank;
use App\Models\WasteCategory;
use Illuminate\Database\Seeder;

class WasteBankSeeder extends Seeder
{
    public function run(): void
    {
        $developer  = User::where('email', 'dev@gogreen.id')->first();
        $jayaUser   = User::where('email', 'jaya@gogreen.id')->first();
        $makmurUser = User::where('email', 'makmur@gogreen.id')->first();

        if (! $developer || ! $jayaUser || ! $makmurUser) {
            $this->command->warn('Jalankan UserSeeder terlebih dahulu.');
            return;
        }

        $cats = WasteCategory::pluck('id', 'slug');

        // ── Bank Sampah Jaya ──────────────────────────────────────────────
        $bank1 = WasteBank::updateOrCreate(
            ['user_id' => $jayaUser->id],
            [
                'name'                => 'Bank Sampah Jaya',
                'address'             => 'Jl. Raya Bogor No. 45, Ciracas, Jakarta Timur',
                'latitude'            => -6.3241580,
                'longitude'           => 106.8737200,
                'phone'               => '021-8765432',
                'description'         => 'Bank sampah terpercaya di Jakarta Timur. Sistem penimbangan digital, harga transparan.',
                'opening_hours'       => [
                    'senin'  => '08:00-17:00',
                    'selasa' => '08:00-17:00',
                    'rabu'   => '08:00-17:00',
                    'kamis'  => '08:00-17:00',
                    'jumat'  => '08:00-15:00',
                    'sabtu'  => '08:00-12:00',
                    'minggu' => 'Tutup',
                ],
                'is_open'             => true,
                'verification_status' => 'verified',
                'verified_by'         => $developer->id,
                'verified_at'         => now(),
            ]
        );

        $bank1->acceptedCategories()->syncWithoutDetaching(
            array_filter([
                $cats['plastik-pet'] ?? null,
                $cats['kardus']      ?? null,
                $cats['kaleng']      ?? null,
                $cats['kertas']      ?? null,
            ])
        );

        // ── Bank Sampah Makmur ────────────────────────────────────────────
        $bank2 = WasteBank::updateOrCreate(
            ['user_id' => $makmurUser->id],
            [
                'name'                => 'Bank Sampah Makmur',
                'address'             => 'Jl. Margonda Raya No. 12, Depok, Jawa Barat',
                'latitude'            => -6.3924100,
                'longitude'           => 106.8317100,
                'phone'               => '021-7654321',
                'description'         => 'Menerima kaca, plastik, dan logam. Pembayaran langsung tunai.',
                'opening_hours'       => [
                    'senin'  => '07:00-16:00',
                    'selasa' => '07:00-16:00',
                    'rabu'   => '07:00-16:00',
                    'kamis'  => '07:00-16:00',
                    'jumat'  => '07:00-14:00',
                    'sabtu'  => '07:00-13:00',
                    'minggu' => 'Tutup',
                ],
                'is_open'             => true,
                'verification_status' => 'verified',
                'verified_by'         => $developer->id,
                'verified_at'         => now(),
            ]
        );

        $bank2->acceptedCategories()->syncWithoutDetaching(
            array_filter([
                $cats['plastik-pet'] ?? null,
                $cats['kaca']        ?? null,
                $cats['kaleng']      ?? null,
            ])
        );
    }
}
