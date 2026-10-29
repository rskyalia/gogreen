<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\DiyGuide;
use App\Models\DiySubmission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
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
                    'proof_image' => $submission->proof_image,
                    'notes' => null,
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
            'diy_guide_id' => ['required', 'integer', Rule::exists('diy_guides', 'id')],
            'proof_image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $guide = DiyGuide::findOrFail($validated['diy_guide_id']);

        $path = $request->file('proof_image')->store('diy-submissions', 'public');

        $submission = DiySubmission::create([
            'user_id' => $user->id,
            'diy_guide_id' => $guide->id,
            'waste_scan_id' => null,
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
                'proof_image' => $submission->proof_image,
                'notes' => $validated['notes'] ?? null,
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
