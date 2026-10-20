<?php

namespace Database\Seeders;

use App\Models\MaterialRequest;
use App\Models\MaterialRequestResponse;
use App\Models\User;
use App\Models\WasteCategory;
use Illuminate\Database\Seeder;

class MaterialRequestSeeder extends Seeder
{
    public function run(): void
    {
        $community = User::where('role', 'community')->first();
        $wasteBank1 = User::where('email', 'jaya@gogreen.id')->first();

        if (! $community) {
            $this->command->warn('Tidak ada user komunitas. Lewati MaterialRequestSeeder.');

            return;
        }

        $cats = WasteCategory::pluck('id', 'slug');

        // ── Permintaan terbuka ────────────────────────────────────────────

        $req1 = MaterialRequest::create([
            'community_id' => $community->id,
            'waste_category_id' => $cats['plastik-pet'] ?? WasteCategory::first()->id,
            'quantity_needed_kg' => 15.00,
            'notes' => 'Digunakan untuk ecobrick workshop bulan depan.',
            'status' => 'open',
        ]);

        $req2 = MaterialRequest::create([
            'community_id' => $community->id,
            'waste_category_id' => $cats['kardus'] ?? WasteCategory::first()->id,
            'quantity_needed_kg' => 30.00,
            'notes' => 'Untuk kerajinan tangan anak-anak.',
            'status' => 'open',
        ]);

        // ── Satu respons yang sudah accepted (untuk test tombol delivered) ─

        if ($wasteBank1) {
            MaterialRequestResponse::create([
                'material_request_id' => $req1->id,
                'responder_id' => $wasteBank1->id,
                'quantity_offered_kg' => 10.00,
                'notes' => 'Siap dikirim minggu depan.',
                'status' => 'accepted',
            ]);
        }
    }
}
