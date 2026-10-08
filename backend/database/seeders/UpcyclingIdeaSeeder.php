<?php

namespace Database\Seeders;

use App\Models\UpcyclingIdea;
use App\Models\WasteCategory;
use Illuminate\Database\Seeder;

class UpcyclingIdeaSeeder extends Seeder
{
    public function run(): void
    {
        $categories = WasteCategory::pluck('id', 'slug');

        if ($categories->isEmpty()) {
            $this->command->warn('Kategori tidak ditemukan, jalankan WasteCategorySeeder terlebih dahulu.');
            return;
        }

        $ideas = [
            // ── Plastik PET ──────────────────────────────────────────────────
            [
                'waste_category_id'    => $categories['plastik-pet'] ?? null,
                'title'                => 'Pot Tanaman dari Botol PET',
                'description'          => 'Ubah botol plastik bekas menjadi pot tanaman gantung yang cantik untuk balkon atau dinding rumahmu.',
                'difficulty'           => 'easy',
                'estimated_minutes'    => 20,
                'estimated_cost'       => 5000,
                'additional_materials' => ['Tali rami', 'Cat akrilik', 'Gunting', 'Paku'],
                'tutorial_steps'       => [
                    ['step' => 1, 'description' => 'Cuci bersih botol plastik dan keringkan.'],
                    ['step' => 2, 'description' => 'Potong botol pada bagian 1/3 dari bawah, sisihkan bagian atas.'],
                    ['step' => 3, 'description' => 'Lubangi bagian bawah untuk drainase menggunakan paku panas.'],
                    ['step' => 4, 'description' => 'Cat bagian luar botol sesuai selera dan biarkan kering.'],
                    ['step' => 5, 'description' => 'Ikat tali rami di bagian leher botol untuk dijadikan gantungan.'],
                    ['step' => 6, 'description' => 'Isi dengan tanah dan tanam bibit favoritmu.'],
                ],
                'video_url'  => null,
                'image'      => null,
                'impact_kg'  => 0.050,
                'is_active'  => true,
            ],
            [
                'waste_category_id'    => $categories['plastik-pet'] ?? null,
                'title'                => 'Celengan Botol Plastik',
                'description'          => 'Jadikan botol plastik bekas sebagai celengan unik dan edukatif untuk anak-anak.',
                'difficulty'           => 'easy',
                'estimated_minutes'    => 30,
                'estimated_cost'       => 10000,
                'additional_materials' => ['Kertas kado / majalah bekas', 'Lem putih', 'Kuas', 'Cutter'],
                'tutorial_steps'       => [
                    ['step' => 1, 'description' => 'Cuci dan keringkan botol plastik.'],
                    ['step' => 2, 'description' => 'Buat celah memanjang di tutup botol menggunakan cutter.'],
                    ['step' => 3, 'description' => 'Potong kertas kado sesuai ukuran botol.'],
                    ['step' => 4, 'description' => 'Tempelkan kertas menggunakan lem putih dan ratakan gelembungnya.'],
                    ['step' => 5, 'description' => 'Biarkan mengering dan celengan siap digunakan.'],
                ],
                'video_url'  => null,
                'image'      => null,
                'impact_kg'  => 0.045,
                'is_active'  => true,
            ],

            // ── Kardus ───────────────────────────────────────────────────────
            [
                'waste_category_id'    => $categories['kardus'] ?? null,
                'title'                => 'Organizer Meja dari Kardus',
                'description'          => 'Buat organizer alat tulis yang rapi dan estetis dari kardus bekas.',
                'difficulty'           => 'easy',
                'estimated_minutes'    => 45,
                'estimated_cost'       => 8000,
                'additional_materials' => ['Lem tembak', 'Kertas kado / wrapping', 'Gunting', 'Penggaris', 'Pensil'],
                'tutorial_steps'       => [
                    ['step' => 1, 'description' => 'Kumpulkan beberapa kardus bekas dengan ukuran berbeda.'],
                    ['step' => 2, 'description' => 'Potong kardus sesuai ukuran yang diinginkan untuk setiap laci/kompartemen.'],
                    ['step' => 3, 'description' => 'Rakit dengan lem tembak membentuk kotak-kotak organizer.'],
                    ['step' => 4, 'description' => 'Lapisi bagian luar dengan kertas kado untuk tampilan estetis.'],
                    ['step' => 5, 'description' => 'Biarkan mengering sempurna sebelum digunakan.'],
                ],
                'video_url'  => null,
                'image'      => null,
                'impact_kg'  => 0.300,
                'is_active'  => true,
            ],
            [
                'waste_category_id'    => $categories['kardus'] ?? null,
                'title'                => 'Tempat Sampah Mini dari Kardus',
                'description'          => 'Ubah kardus menjadi tempat sampah meja yang berguna untuk kantor atau kamar tidur.',
                'difficulty'           => 'medium',
                'estimated_minutes'    => 60,
                'estimated_cost'       => 15000,
                'additional_materials' => ['Lem tembak', 'Cat poster', 'Kuas', 'Pelapis anti air (opsional)'],
                'tutorial_steps'       => [
                    ['step' => 1, 'description' => 'Pilih kardus yang cukup kuat dan bersih.'],
                    ['step' => 2, 'description' => 'Bentuk dan perkuat sudut-sudut kardus dengan lem tembak.'],
                    ['step' => 3, 'description' => 'Cat bagian dalam dan luar sesuai desain yang diinginkan.'],
                    ['step' => 4, 'description' => 'Lapisi dengan pelapis anti air jika tersedia.'],
                    ['step' => 5, 'description' => 'Tambahkan hiasan atau stiker sesuai kreativitas.'],
                ],
                'video_url'  => null,
                'image'      => null,
                'impact_kg'  => 0.500,
                'is_active'  => true,
            ],

            // ── Kaleng ───────────────────────────────────────────────────────
            [
                'waste_category_id'    => $categories['kaleng'] ?? null,
                'title'                => 'Lampion dari Kaleng Bekas',
                'description'          => 'Ciptakan lampion indah dari kaleng aluminium bekas untuk dekorasi rumah atau taman.',
                'difficulty'           => 'medium',
                'estimated_minutes'    => 90,
                'estimated_cost'       => 20000,
                'additional_materials' => ['Paku', 'Palu', 'Lilin / LED', 'Kawat', 'Spidol'],
                'tutorial_steps'       => [
                    ['step' => 1, 'description' => 'Isi kaleng dengan air dan bekukan di freezer (agar tidak penyok saat dilubangi).'],
                    ['step' => 2, 'description' => 'Gambar pola desain pada permukaan kaleng menggunakan spidol.'],
                    ['step' => 3, 'description' => 'Lubangi mengikuti pola menggunakan paku dan palu.'],
                    ['step' => 4, 'description' => 'Biarkan es mencair dan keringkan kaleng.'],
                    ['step' => 5, 'description' => 'Buat lubang di bagian atas untuk kawat gantungan.'],
                    ['step' => 6, 'description' => 'Masukkan lilin atau lampu LED dan lampion siap dipajang.'],
                ],
                'video_url'  => null,
                'image'      => null,
                'impact_kg'  => 0.015,
                'is_active'  => true,
            ],

            // ── Kertas ───────────────────────────────────────────────────────
            [
                'waste_category_id'    => $categories['kertas'] ?? null,
                'title'                => 'Kertas Daur Ulang Buatan Sendiri',
                'description'          => 'Buat kertas baru dari kertas bekas menggunakan teknik papermache sederhana.',
                'difficulty'           => 'hard',
                'estimated_minutes'    => 120,
                'estimated_cost'       => 25000,
                'additional_materials' => ['Blender', 'Bingkai kayu', 'Kain kasa', 'Air', 'Papan kayu'],
                'tutorial_steps'       => [
                    ['step' => 1, 'description' => 'Robek kertas bekas menjadi potongan kecil-kecil.'],
                    ['step' => 2, 'description' => 'Rendam potongan kertas dalam air selama minimal 1 jam.'],
                    ['step' => 3, 'description' => 'Blender campuran kertas dan air hingga menjadi bubur kertas.'],
                    ['step' => 4, 'description' => 'Tuang bubur ke bingkai kasa dan ratakan.'],
                    ['step' => 5, 'description' => 'Angkat bingkai dan biarkan tiris, lalu pindahkan ke papan.'],
                    ['step' => 6, 'description' => 'Jemur di bawah sinar matahari hingga benar-benar kering (4-6 jam).'],
                    ['step' => 7, 'description' => 'Kupas kertas dari papan dengan hati-hati dan siap digunakan.'],
                ],
                'video_url'  => null,
                'image'      => null,
                'impact_kg'  => 0.200,
                'is_active'  => true,
            ],

            // ── Organik ──────────────────────────────────────────────────────
            [
                'waste_category_id'    => $categories['organik'] ?? null,
                'title'                => 'Kompos dari Sampah Dapur',
                'description'          => 'Ubah sisa sayuran, buah, dan daun kering menjadi pupuk kompos berkualitas untuk tanaman.',
                'difficulty'           => 'easy',
                'estimated_minutes'    => 30,
                'estimated_cost'       => 30000,
                'additional_materials' => ['Ember / komposter', 'Sekam / serbuk kayu', 'Stater EM4 (opsional)'],
                'tutorial_steps'       => [
                    ['step' => 1, 'description' => 'Siapkan komposter atau ember besar berlubang.'],
                    ['step' => 2, 'description' => 'Lapisi dasar dengan sekam atau tanah tipis.'],
                    ['step' => 3, 'description' => 'Masukkan sampah organik dan taburi sekam/serbuk kayu di atasnya.'],
                    ['step' => 4, 'description' => 'Ulangi setiap hari, aduk seminggu sekali untuk aerasi.'],
                    ['step' => 5, 'description' => 'Setelah 4-8 minggu, kompos siap digunakan sebagai pupuk.'],
                ],
                'video_url'  => null,
                'image'      => null,
                'impact_kg'  => 2.000,
                'is_active'  => true,
            ],
        ];

        foreach ($ideas as $idea) {
            if (! $idea['waste_category_id']) {
                continue;
            }

            UpcyclingIdea::updateOrCreate(
                [
                    'waste_category_id' => $idea['waste_category_id'],
                    'title'             => $idea['title'],
                ],
                $idea
            );
        }
    }
}
