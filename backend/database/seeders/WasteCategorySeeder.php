<?php

namespace Database\Seeders;

use App\Models\WasteCategory;
use Illuminate\Database\Seeder;

class WasteCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name'          => 'Plastik PET',
                'slug'          => 'plastik-pet',
                'description'   => 'Botol minuman & wadah makanan berbahan PET. Bisa didaur ulang menjadi serat tekstil dan kemasan baru.',
                'is_recyclable' => true,
                'is_upcyclable' => true,
                'points_per_kg' => 30,
                'icon'          => '🧴',
            ],
            [
                'name'          => 'Kardus',
                'slug'          => 'kardus',
                'description'   => 'Kotak kardus dan karton gelombang. Mudah didaur ulang menjadi kertas baru atau bahan kemasan.',
                'is_recyclable' => true,
                'is_upcyclable' => true,
                'points_per_kg' => 15,
                'icon'          => '📦',
            ],
            [
                'name'          => 'Kaleng',
                'slug'          => 'kaleng',
                'description'   => 'Kaleng aluminium dan kaleng baja. Logam dapat didaur ulang terus-menerus tanpa kehilangan kualitas.',
                'is_recyclable' => true,
                'is_upcyclable' => true,
                'points_per_kg' => 50,
                'icon'          => '🥫',
            ],
            [
                'name'          => 'Kaca',
                'slug'          => 'kaca',
                'description'   => 'Botol kaca dan toples. Dapat didaur ulang sepenuhnya dan dilebur menjadi produk kaca baru.',
                'is_recyclable' => true,
                'is_upcyclable' => true,
                'points_per_kg' => 10,
                'icon'          => '🍶',
            ],
            [
                'name'          => 'Organik',
                'slug'          => 'organik',
                'description'   => 'Sisa makanan, daun, dan ranting. Dapat diolah menjadi kompos atau biogas.',
                'is_recyclable' => false,
                'is_upcyclable' => true,
                'points_per_kg' => 5,
                'icon'          => '🌿',
            ],
            [
                'name'          => 'Kertas',
                'slug'          => 'kertas',
                'description'   => 'Koran, majalah, dan kertas kantor. Dapat didaur ulang menjadi kertas baru.',
                'is_recyclable' => true,
                'is_upcyclable' => true,
                'points_per_kg' => 10,
                'icon'          => '📰',
            ],
        ];

        foreach ($categories as $data) {
            WasteCategory::updateOrCreate(['slug' => $data['slug']], $data);
        }
    }
}
