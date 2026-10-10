<?php

namespace Database\Seeders;

use App\Models\DiyGuide;
use App\Models\User;
use App\Models\WasteCategory;
use Illuminate\Database\Seeder;

class DiyGuideSeeder extends Seeder
{
    public function run(): void
    {
        $komunitas = User::where('email', 'komunitas@gogreen.id')->first();
        $developer = User::where('email', 'dev@gogreen.id')->first();

        if (! $komunitas || ! $developer) {
            $this->command->warn('Jalankan UserSeeder terlebih dahulu.');
            return;
        }

        $cats = WasteCategory::pluck('id', 'slug');

        $guides = [
            // ── Plastik PET ──────────────────────────────────────────────
            [
                'waste_category_id' => $cats['plastik-pet'] ?? null,
                'created_by'        => $komunitas->id,
                'title'             => 'Pot Gantung dari Botol PET',
                'description'       => 'Ubah botol plastik bekas menjadi pot tanaman gantung yang cantik untuk balkon atau dinding rumahmu.',
                'difficulty'        => 'easy',
                'estimated_minutes' => 20,
                'estimated_cost'    => 5_000,
                'materials'         => ['Tali rami', 'Cat akrilik', 'Gunting', 'Paku'],
                'steps'             => [
                    ['step' => 1, 'description' => 'Cuci bersih botol plastik dan keringkan.'],
                    ['step' => 2, 'description' => 'Potong botol pada bagian 1/3 dari bawah.'],
                    ['step' => 3, 'description' => 'Lubangi dasar botol untuk drainase.'],
                    ['step' => 4, 'description' => 'Cat bagian luar sesuai selera dan biarkan kering.'],
                    ['step' => 5, 'description' => 'Ikat tali rami di leher botol untuk gantungan.'],
                    ['step' => 6, 'description' => 'Isi dengan tanah dan tanam bibit favoritmu.'],
                ],
                'cover_image'   => null,
                'video_url'     => null,
                'reward_points' => 20,
                'is_published'  => true,
            ],
            [
                'waste_category_id' => $cats['plastik-pet'] ?? null,
                'created_by'        => $komunitas->id,
                'title'             => 'Celengan Botol Plastik',
                'description'       => 'Jadikan botol plastik bekas sebagai celengan unik dan edukatif untuk anak-anak.',
                'difficulty'        => 'easy',
                'estimated_minutes' => 30,
                'estimated_cost'    => 10_000,
                'materials'         => ['Kertas kado', 'Lem putih', 'Kuas', 'Cutter'],
                'steps'             => [
                    ['step' => 1, 'description' => 'Cuci dan keringkan botol plastik.'],
                    ['step' => 2, 'description' => 'Buat celah memanjang di tutup botol menggunakan cutter.'],
                    ['step' => 3, 'description' => 'Potong kertas kado sesuai ukuran botol.'],
                    ['step' => 4, 'description' => 'Tempelkan kertas dengan lem putih dan ratakan gelembung.'],
                    ['step' => 5, 'description' => 'Biarkan mengering — celengan siap digunakan.'],
                ],
                'cover_image'   => null,
                'video_url'     => null,
                'reward_points' => 15,
                'is_published'  => true,
            ],

            // ── Kardus ───────────────────────────────────────────────────
            [
                'waste_category_id' => $cats['kardus'] ?? null,
                'created_by'        => $developer->id,
                'title'             => 'Organizer Meja dari Kardus',
                'description'       => 'Buat organizer alat tulis yang rapi dan estetis dari kardus bekas.',
                'difficulty'        => 'easy',
                'estimated_minutes' => 45,
                'estimated_cost'    => 8_000,
                'materials'         => ['Lem tembak', 'Kertas wrapping', 'Gunting', 'Penggaris'],
                'steps'             => [
                    ['step' => 1, 'description' => 'Kumpulkan beberapa kardus bekas berbeda ukuran.'],
                    ['step' => 2, 'description' => 'Potong kardus sesuai ukuran kompartemen yang diinginkan.'],
                    ['step' => 3, 'description' => 'Rakit dengan lem tembak membentuk kotak organizer.'],
                    ['step' => 4, 'description' => 'Lapisi luar dengan kertas wrapping yang estetis.'],
                    ['step' => 5, 'description' => 'Biarkan kering sempurna sebelum digunakan.'],
                ],
                'cover_image'   => null,
                'video_url'     => null,
                'reward_points' => 20,
                'is_published'  => true,
            ],

            // ── Kaleng ───────────────────────────────────────────────────
            [
                'waste_category_id' => $cats['kaleng'] ?? null,
                'created_by'        => $komunitas->id,
                'title'             => 'Lampion dari Kaleng Bekas',
                'description'       => 'Ciptakan lampion indah dari kaleng aluminium untuk dekorasi rumah atau taman.',
                'difficulty'        => 'medium',
                'estimated_minutes' => 90,
                'estimated_cost'    => 20_000,
                'materials'         => ['Paku', 'Palu', 'Lilin / LED', 'Kawat', 'Spidol'],
                'steps'             => [
                    ['step' => 1, 'description' => 'Isi kaleng dengan air dan bekukan agar tidak penyok.'],
                    ['step' => 2, 'description' => 'Gambar pola desain di permukaan kaleng.'],
                    ['step' => 3, 'description' => 'Lubangi mengikuti pola dengan paku dan palu.'],
                    ['step' => 4, 'description' => 'Biarkan es mencair dan keringkan kaleng.'],
                    ['step' => 5, 'description' => 'Buat lubang di atas untuk kawat gantungan.'],
                    ['step' => 6, 'description' => 'Masukkan lilin atau lampu LED — lampion siap dipajang.'],
                ],
                'cover_image'   => null,
                'video_url'     => null,
                'reward_points' => 30,
                'is_published'  => true,
            ],

            // ── Organik ──────────────────────────────────────────────────
            [
                'waste_category_id' => $cats['organik'] ?? null,
                'created_by'        => $developer->id,
                'title'             => 'Kompos dari Sampah Dapur',
                'description'       => 'Ubah sisa sayuran dan daun kering menjadi pupuk kompos berkualitas.',
                'difficulty'        => 'easy',
                'estimated_minutes' => 30,
                'estimated_cost'    => 30_000,
                'materials'         => ['Ember / komposter', 'Sekam / serbuk kayu', 'Starter EM4 (opsional)'],
                'steps'             => [
                    ['step' => 1, 'description' => 'Siapkan komposter atau ember besar berlubang.'],
                    ['step' => 2, 'description' => 'Lapisi dasar dengan sekam atau tanah tipis.'],
                    ['step' => 3, 'description' => 'Masukkan sampah organik dan taburi sekam di atasnya.'],
                    ['step' => 4, 'description' => 'Ulangi setiap hari, aduk seminggu sekali untuk aerasi.'],
                    ['step' => 5, 'description' => 'Setelah 4–8 minggu, kompos siap sebagai pupuk.'],
                ],
                'cover_image'   => null,
                'video_url'     => null,
                'reward_points' => 25,
                'is_published'  => true,
            ],

            // ── Kertas ───────────────────────────────────────────────────
            [
                'waste_category_id' => $cats['kertas'] ?? null,
                'created_by'        => $komunitas->id,
                'title'             => 'Kertas Daur Ulang Buatan Sendiri',
                'description'       => 'Buat kertas baru dari kertas bekas menggunakan teknik papermache sederhana.',
                'difficulty'        => 'hard',
                'estimated_minutes' => 120,
                'estimated_cost'    => 25_000,
                'materials'         => ['Blender', 'Bingkai kayu + kain kasa', 'Air', 'Papan kayu'],
                'steps'             => [
                    ['step' => 1, 'description' => 'Robek kertas bekas menjadi potongan kecil.'],
                    ['step' => 2, 'description' => 'Rendam dalam air minimal 1 jam.'],
                    ['step' => 3, 'description' => 'Blender campuran kertas dan air hingga jadi bubur.'],
                    ['step' => 4, 'description' => 'Tuang bubur ke bingkai kasa dan ratakan.'],
                    ['step' => 5, 'description' => 'Angkat bingkai, tiriskan, pindahkan ke papan.'],
                    ['step' => 6, 'description' => 'Jemur 4–6 jam hingga kering sempurna.'],
                    ['step' => 7, 'description' => 'Kupas dari papan dengan hati-hati — kertas siap pakai.'],
                ],
                'cover_image'   => null,
                'video_url'     => null,
                'reward_points' => 40,
                'is_published'  => true,
            ],
        ];

        foreach ($guides as $data) {
            if (! $data['waste_category_id']) {
                continue;
            }

            DiyGuide::updateOrCreate(
                [
                    'waste_category_id' => $data['waste_category_id'],
                    'title'             => $data['title'],
                ],
                $data
            );
        }
    }
}
