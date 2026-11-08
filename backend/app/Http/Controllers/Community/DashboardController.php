<?php

namespace App\Http\Controllers\Community;

use App\Http\Controllers\Controller;
use App\Models\DiySubmission;
use App\Models\MaterialRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        $limit = max(1, (int) $request->query('limit', 10));

        $submissions = DiySubmission::with([
            'user:id,name',
            'diyGuide:id,title,waste_category_id',
            'diyGuide.wasteCategory:id,name',
        ])
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(function (DiySubmission $submission) {
                return [
                    'id' => $submission->id,
                    'user' => $submission->user?->name ?? 'Pengguna',
                    'guide' => $submission->diyGuide?->title ?? 'Karya DIY',
                    'category' => $submission->diyGuide?->wasteCategory?->name ?? 'Umum',
                    'status' => $submission->status,
                    'points' => (int) $submission->points_awarded,
                    'created_at' => $submission->created_at?->toIso8601String(),
                ];
            })
            ->values()
            ->all();

        return response()->json([
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                ],
                'stats' => [
                    'pending' => DiySubmission::where('status', 'pending')->count(),
                    'approved' => DiySubmission::where('status', 'approved')->count(),
                    'rejected' => DiySubmission::where('status', 'rejected')->count(),
                    'open_material_requests' => MaterialRequest::where('status', 'open')->count(),
                ],
                'submissions' => $submissions,
            ],
        ]);
    }
}
