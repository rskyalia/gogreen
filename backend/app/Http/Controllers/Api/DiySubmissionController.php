<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DiySubmission;
use App\Models\DiyGuide;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class DiySubmissionController extends Controller
{
    use ApiResponse;

    // 1. User mengunggah bukti foto hasil karya DIY
    public function submit(Request $request)
    {
        $request->validate([
            'diy_guide_id' => 'required|exists:diy_guides,id',
            'proof_image'  => 'required|image|mimes:jpeg,png,jpg|max:5120',
            'notes'        => 'nullable|string',
        ]);

        $imagePath = $request->file('proof_image')->store('diy-submissions', 'public');

        $submission = DiySubmission::create([
            'user_id'      => $request->user()->id,
            'diy_guide_id' => $request->diy_guide_id,
            'proof_image'  => $imagePath,
            'notes'        => $request->notes,
            'status'       => 'pending',
        ]);

        return $this->successResponse($submission, 'Bukti karya berhasil dikirim! Menunggu kurasi.', 201);
    }

    // 2. Daftar kiriman karya yang butuh dikurasi (Khusus Admin & Komunitas DIY)
    public function index(Request $request)
    {
        if (!$request->user()->hasAnyRole(['admin', 'komunitas_diy'])) {
            return $this->errorResponse('Akses ditolak.', 403);
        }

        $submissions = DiySubmission::with(['user:id,name,email', 'diyGuide:id,title,points_reward'])
            ->where('status', 'pending')
            ->latest()
            ->get();

        return $this->successResponse($submissions, 'Daftar pengajuan karya DIY berhasil diambil');
    }

    // 3. Kurasi Karya (Approve / Reject & Beri Poin)
    public function validateSubmission(Request $request, $id)
    {
        $user = $request->user();

        if (!$user->hasAnyRole(['developer', 'komunitas_diy'])) {
            return $this->errorResponse('Akses ditolak.', 403);
        }

        $request->validate([
            'status'           => 'required|in:approved,rejected',
            'rejection_reason' => 'required_if:status,rejected|nullable|string',
        ]);

        $submission = DiySubmission::with('diyGuide', 'user')->find($id);

        if (!$submission) {
            return $this->errorResponse('Pengajuan tidak ditemukan', 404);
        }

        if ($submission->status !== 'pending') {
            return $this->errorResponse('Pengajuan ini sudah pernah diproses.', 400);
        }

        $submission->status = $request->status;
        $submission->validated_by = $user->id;

        if ($request->status === 'approved') {
            // Tambahkan poin ke user yang membuat karya
            $pointsEarned = $submission->diyGuide->points_reward;
            $submission->user->increment('points', $pointsEarned);
        } else {
            $submission->rejection_reason = $request->rejection_reason;
        }

        $submission->save();

        return $this->successResponse($submission, 'Status karya berhasil diperbarui!');
    }
}
