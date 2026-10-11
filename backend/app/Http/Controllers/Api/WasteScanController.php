<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WasteScan;
use App\Models\DiyGuide;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class WasteScanController extends Controller
{
    use ApiResponse;

    public function scan(Request $request)
    {
        // 1. Validasi file foto
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg|max:5120', // maks 5MB
        ]);

        // 2. Simpan gambar ke storage lokal
        $path = $request->file('image')->store('waste-scans', 'public');

        // 3. Nanti di sini kamu tembak API Flask/Python ML pake HTTP Client Laravel
        /*
        $mlResponse = Http::attach(
            'file', file_get_contents($request->file('image')), 'waste.jpg'
        )->post('http://127.0.0.1:5000/predict');
        */

        // DUMMY DATA ML (Sementara sebelum service ML temen kamu ready)
        $detectedCategory = 'Botol Plastik PET';
        $wasteType = 'recyclable'; 
        $confidenceScore = 94.5;

        // 4. Simpan hasil scan ke Database
        $scan = WasteScan::create([
            'user_id' => $request->user()->id,
            'image_path' => $path,
            'detected_category' => $detectedCategory,
            'waste_type' => $wasteType,
            'confidence_score' => $confidenceScore,
        ]);

        // 5. Ambil rekomendasi DIY yang cocok berdasarkan kategori sampah
        $recommendations = DiyGuide::where('waste_category', 'LIKE', '%' . $detectedCategory . '%')
            ->orWhere('waste_category', 'plastik')
            ->get();

        return $this->successResponse([
            'scan_result' => $scan,
            'recommendations' => $recommendations,
        ], 'Foto sampah berhasil di-scan!');
    }
}