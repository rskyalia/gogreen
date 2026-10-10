<?php

namespace Database\Seeders;

use App\Models\Reward;
use App\Models\User;
use Illuminate\Database\Seeder;

class RewardSeeder extends Seeder
{
    public function run(): void
    {
        $developer = User::where('email', 'dev@gogreen.id')->first();

        if (! $developer) {
            $this->command->warn('Jalankan UserSeeder terlebih dahulu.');
            return;
        }

        $rewards = [
            [
                'name'        => 'Voucher Belanja Rp10.000',
                'description' => 'Voucher belanja digital senilai Rp10.000 yang bisa digunakan di merchant partner GO GREEN.',
                'image'       => null,
                'points_cost' => 100,
                'stock'       => 50,
                'is_active'   => true,
            ],
            [
                'name'        => 'Bibit Tanaman Gratis',
                'description' => 'Dapatkan satu pot bibit tanaman sayuran organik untuk ditanam di rumah.',
                'image'       => null,
                'points_cost' => 50,
                'stock'       => 30,
                'is_active'   => true,
            ],
            [
                'name'        => 'Tote Bag Ramah Lingkungan',
                'description' => 'Tote bag berbahan kanvas daur ulang dengan desain eksklusif GO GREEN.',
                'image'       => null,
                'points_cost' => 150,
                'stock'       => 20,
                'is_active'   => true,
            ],
            [
                'name'        => 'Tumbler Stainless GO GREEN',
                'description' => 'Tumbler stainless steel 500ml berinsulasi. Kurangi sampah botol plastik setiap hari.',
                'image'       => null,
                'points_cost' => 300,
                'stock'       => 10,
                'is_active'   => true,
            ],
            [
                'name'        => 'Donasi 1 Pohon',
                'description' => 'Poinmu dikonversi menjadi donasi penanaman 1 pohon di program penghijauan nasional.',
                'image'       => null,
                'points_cost' => 200,
                'stock'       => null, // tidak terbatas
                'is_active'   => true,
            ],
            [
                'name'        => 'Voucher Kopi Gratis',
                'description' => 'Satu gelas kopi gratis di kedai partner GO GREEN. Bawa tumbler sendiri untuk diskon ekstra!',
                'image'       => null,
                'points_cost' => 75,
                'stock'       => 100,
                'is_active'   => true,
            ],
        ];

        foreach ($rewards as $data) {
            Reward::updateOrCreate(
                ['name' => $data['name']],
                array_merge($data, ['created_by' => $developer->id])
            );
        }
    }
}
