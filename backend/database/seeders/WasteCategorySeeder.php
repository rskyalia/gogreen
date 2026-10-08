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
                'description'   => 'Botol minuman, wadah makanan berbahan PET (Polyethylene Terephthalate). Dapat didaur ulang menjadi serat tekstil, kemasan baru, dan berbagai produk lainnya.',
                'is_recyclable' => true,
                'icon'          => '🧴',
            ],
            [
                'name'          => 'Kardus',
                'slug'          => 'kardus',
                'description'   => 'Kotak kardus, karton gelombang, dan kemasan kertas tebal. Mudah didaur ulang menjadi kertas baru atau bahan kemasan.',
                'is_recyclable' => true,
                'icon'          => '📦',
            ],
            [
                'name'          => 'Kaleng',
                'slug'          => 'kaleng',
                'description'   => 'Kaleng aluminium (minuman, makanan) dan kaleng baja. Logam dapat didaur ulang secara terus-menerus tanpa kehilangan kualitas.',
                'is_recyclable' => true,
                'icon'          => '🥫',
            ],
            [
                'name'          => 'Kaca',
                'slug'          => 'kaca',
                'description'   => 'Botol kaca, toples, dan kaca lembaran. Dapat didaur ulang sepenuhnya dan dilebur menjadi produk kaca baru.',
                'is_recyclable' => true,
                'icon'          => '🍶',
            ],
            [
                'name'          => 'Organik',
                'slug'          => 'organik',
                'description'   => 'Sisa makanan, daun, ranting, dan bahan organik lainnya. Dapat diolah menjadi kompos atau biogas.',
                'is_recyclable' => false,
                'icon'          => '🌿',
            ],
            [
                'name'          => 'Kertas',
                'slug'          => 'kertas',
                'description'   => 'Koran, majalah, buku bekas, dan kertas kantor. Dapat didaur ulang menjadi kertas baru dengan kualitas lebih rendah.',
                'is_recyclable' => true,
                'icon'          => '📰',
            ],
        ];

        foreach ($categories as $category) {
            WasteCategory::updateOrCreate(
                ['slug' => $category['slug']],
                $category
            );
        }
    }
}
