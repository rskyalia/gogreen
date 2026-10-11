<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DiyGuide;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class DiyGuideController extends Controller
{
    use ApiResponse;

    // 1. Tampilkan semua katalog DIY (Bisa diakses semua user)
    public function index()
    {
        $guides = DiyGuide::with('creator:id,name')->latest()->get();
        return $this->successResponse($guides, 'Daftar panduan DIY berhasil diambil');
    }

    // 2. Tambah panduan DIY baru (Khusus Admin & Komunitas DIY)
    public function store(Request $request)
    {
        $user = $request->user();

        // Validasi role
        if (!$user->hasAnyRole(['developer', 'komunitas_diy'])) {
            return $this->errorResponse('Akses ditolak.', 403);
        }

        $request->validate([
            'title'          => 'required|string|max:255',
            'waste_category' => 'required|string',
            'description'    => 'required|string',
            'difficulty'     => 'required|in:easy,medium,hard',
            'points_reward'  => 'required|integer|min:1',
            'steps'          => 'required|array', // Dikirim berbentuk array list langkah
            'image'          => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('diy-guides', 'public');
        }

        $guide = DiyGuide::create([
            'creator_id'     => $user->id,
            'title'          => $request->title,
            'waste_category' => $request->waste_category,
            'description'    => $request->description,
            'difficulty'     => $request->difficulty,
            'points_reward'  => $request->points_reward,
            'steps'          => $request->steps,
            'image_path'     => $imagePath,
        ]);

        return $this->successResponse($guide, 'Panduan DIY berhasil dibuat!', 201);
    }

    // 3. Detail 1 Panduan DIY
    public function show($id)
    {
        $guide = DiyGuide::with('creator:id,name')->find($id);

        if (!$guide) {
            return $this->errorResponse('Panduan DIY tidak ditemukan', 404);
        }

        return $this->successResponse($guide, 'Detail panduan DIY berhasil diambil');
    }
}
