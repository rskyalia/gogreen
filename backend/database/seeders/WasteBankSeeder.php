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
        $wb1User = User::where('email', 'banksampahjaya@gogreen.id')->first();
        $wb2User = User::where('email', 'banksampahmakmur@gogreen.id')->first();

        if (! $wb1User || ! $wb2User) {
            $this->command->warn('Waste bank users tidak ditemukan, jalankan UserSeeder terlebih dahulu.');
            return;
        }

        $categories = WasteCategory::pluck('id', 'slug');

        // ── Bank Sampah Jaya ──────────────────────────────────────────────────
        $bank1 = WasteBank::updateOrCreate(
            ['user_id' => $wb1User->id],
            [
                'name'            => 'Bank Sampah Jaya',
                'address'         => 'Jl. Raya Bogor No. 45, Ciracas, Jakarta Timur',
                'latitude'        => -6.3241580,
                'longitude'       => 106.8737200,
                'phone'           => '021-8765432',
                'operating_hours' => [
                    'senin'  => '08:00-17:00',
                    'selasa' => '08:00-17:00',
                    'rabu'   => '08:00-17:00',
                    'kamis'  => '08:00-17:00',
                    'jumat'  => '08:00-15:00',
                    'sabtu'  => '08:00-12:00',
                    'minggu' => 'Tutup',
                ],
                'description' => 'Bank sampah terpercaya di wilayah Jakarta Timur. Menerima berbagai jenis sampah anorganik dan memberikan harga terbaik.',
                'is_active'   => true,
                'is_verified' => true,
            ]
        );

        // Kategori yang diterima
        if ($categories->has('plastik-pet')) {
            $bank1->acceptedCategories()->syncWithoutDetaching([
                $categories['plastik-pet'] => ['price_per_kg' => 3500],
                $categories['kardus']      => ['price_per_kg' => 1500],
                $categories['kaleng']      => ['price_per_kg' => 8000],
                $categories['kertas']      => ['price_per_kg' => 1000],
            ]);
        }

        // ── Bank Sampah Makmur ────────────────────────────────────────────────
        $bank2 = WasteBank::updateOrCreate(
            ['user_id' => $wb2User->id],
            [
                'name'            => 'Bank Sampah Makmur',
                'address'         => 'Jl. Margonda Raya No. 12, Depok, Jawa Barat',
                'latitude'        => -6.3924100,
                'longitude'       => 106.8317100,
                'phone'           => '021-7654321',
                'operating_hours' => [
                    'senin'  => '07:00-16:00',
                    'selasa' => '07:00-16:00',
                    'rabu'   => '07:00-16:00',
                    'kamis'  => '07:00-16:00',
                    'jumat'  => '07:00-14:00',
                    'sabtu'  => '07:00-13:00',
                    'minggu' => 'Tutup',
                ],
                'description' => 'Bank sampah dengan sistem penimbangan digital dan pembayaran langsung. Menerima kaca, plastik, dan logam.',
                'is_active'   => true,
                'is_verified' => true,
            ]
        );

        if ($categories->has('kaca')) {
            $bank2->acceptedCategories()->syncWithoutDetaching([
                $categories['plastik-pet'] => ['price_per_kg' => 3200],
                $categories['kaca']        => ['price_per_kg' => 500],
                $categories['kaleng']      => ['price_per_kg' => 7500],
            ]);
        }
    }
}
