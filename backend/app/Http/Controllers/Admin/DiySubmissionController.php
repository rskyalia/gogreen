<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DiySubmission;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class DiySubmissionController extends Controller
{
    /**
     * GET /api/admin/diy-submissions?status=pending
     */
    public function index(Request $request): JsonResponse
    {
        $submissions = DiySubmission::with(['user', 'diyGuide.wasteCategory', 'reviewer'])
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->orderBy('created_at', 'asc')
            ->paginate(15);

        return response()->json([
            'data' => $submissions->items(),
            'meta' => [
                'current_page' => $submissions->currentPage(),
                'last_page' => $submissions->lastPage(),
                'total' => $submissions->total(),
                'per_page' => $submissions->perPage(),
            ],
        ]);
    }

    /**
     * PATCH /api/admin/diy-submissions/{id}/review
     *
     * Body: { status: approved|rejected, review_note?: string }
     *
     * Saat approved, dalam satu DB::transaction:
     *   - kunci baris submission
     *   - pastikan status masih pending
     *   - beri poin = diy_guides.reward_points via DiySubmission::approve()
     *   - tidak boleh memberi poin dua kali
     */
    public function review(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'review_note' => [
                Rule::requiredIf(fn () => $request->status === 'rejected'),
                'nullable',
                'string',
                'max:1000',
            ],
        ]);

        /** @var User $reviewer */
        $reviewer = $request->user();

        DB::transaction(function () use ($validated, $reviewer, $id) {
            // Kunci baris untuk mencegah double-review concurrent
            $submission = DiySubmission::lockForUpdate()
                ->with(['diyGuide', 'user'])
                ->findOrFail($id);

            if ($submission->status !== 'pending') {
                throw ValidationException::withMessages([
                    'status' => ['Submission ini sudah diproses.'],
                ]);
            }

            if ($validated['status'] === 'approved') {
                $submission->approve($reviewer);
            } else {
                $submission->reject($reviewer, $validated['review_note'] ?? '');
            }
        });

        $submission = DiySubmission::with(['user', 'diyGuide', 'reviewer'])->findOrFail($id);

        return response()->json([
            'message' => $validated['status'] === 'approved'
                ? 'Karya disetujui dan poin diberikan.'
                : 'Karya ditolak.',
            'data' => $submission,
        ]);
    }
}
