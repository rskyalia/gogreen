<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\DiySubmission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class DiySubmissionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();

        $submissions = DiySubmission::with(['diyGuide:id,title,reward_points'])
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $submissions->map(function (DiySubmission $submission) {
                return [
                    'id' => $submission->id,
                    'user_id' => $submission->user_id,
                    'diy_guide_id' => $submission->diy_guide_id,
                    'title' => $submission->title,
                    'category' => $submission->category,
                    'proof_image' => $submission->proof_image,
                    'notes' => $submission->notes,
                    'status' => $submission->status,
                    'rejection_reason' => $submission->review_note,
                    'review_note' => $submission->review_note,
                    'points_awarded' => $submission->points_awarded,
                    'created_at' => $submission->created_at?->toIso8601String(),
                    'updated_at' => $submission->updated_at?->toIso8601String(),
                    'diy_guide' => $submission->diyGuide ? [
                        'id' => $submission->diyGuide->id,
                        'title' => $submission->diyGuide->title,
                        'points_reward' => $submission->diyGuide->reward_points,
                    ] : null,
                ];
            }),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'diy_guide_id' => ['nullable', 'integer', Rule::exists('diy_guides', 'id')],
            'title' => ['nullable', 'string', 'max:120'],
            'category' => ['nullable', 'string', 'max:80'],
            'proof_image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $hasGuide = ! empty($validated['diy_guide_id']);

        // Karya mandiri wajib punya judul dan kategori.
        if (! $hasGuide) {
            $request->validate([
                'title' => ['required', 'string', 'max:120'],
                'category' => ['required', 'string', 'max:80'],
            ]);
        }

        $path = $request->file('proof_image')->store('diy-submissions', 'public');

        $submission = DiySubmission::create([
            'user_id' => $user->id,
            'diy_guide_id' => $hasGuide ? $validated['diy_guide_id'] : null,
            'waste_scan_id' => null,
            'title' => $hasGuide ? null : $validated['title'],
            'category' => $hasGuide ? null : $validated['category'],
            'notes' => $validated['notes'] ?? null,
            'proof_image' => $path,
            'status' => 'pending',
            'review_note' => null,
            'reviewed_by' => null,
            'reviewed_at' => null,
            'points_awarded' => 0,
        ]);

        $submission->load('diyGuide:id,title,reward_points');

        return response()->json([
            'message' => 'Karya berhasil dikirim. Menunggu validasi.',
            'data' => [
                'id' => $submission->id,
                'user_id' => $submission->user_id,
                'diy_guide_id' => $submission->diy_guide_id,
                'title' => $submission->title,
                'category' => $submission->category,
                'proof_image' => $submission->proof_image,
                'notes' => $submission->notes,
                'status' => $submission->status,
                'created_at' => $submission->created_at?->toIso8601String(),
                'diy_guide' => $submission->diyGuide ? [
                    'id' => $submission->diyGuide->id,
                    'title' => $submission->diyGuide->title,
                    'points_reward' => $submission->diyGuide->reward_points,
                ] : null,
            ],
        ], 201);
    }
}
