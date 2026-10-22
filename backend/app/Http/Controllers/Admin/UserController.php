<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    /**
     * GET /api/admin/users?role=&status=&search=&page=
     */
    public function index(Request $request): JsonResponse
    {
        $users = User::when($request->role, fn ($q, $r) => $q->where('role', $r))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->search, function ($q, $s) {
                $q->where(function ($inner) use ($s) {
                    $inner->where('name', 'like', "%{$s}%")
                        ->orWhere('email', 'like', "%{$s}%")
                        ->orWhere('member_code', 'like', "%{$s}%");
                });
            })
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => UserResource::collection($users->items()),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'total' => $users->total(),
                'per_page' => $users->perPage(),
            ],
        ]);
    }

    /**
     * GET /api/admin/users/{id}
     */
    public function show(int $id): JsonResponse
    {
        $user = User::with('wasteBank')->findOrFail($id);

        return response()->json(['data' => new UserResource($user)]);
    }

    /**
     * PATCH /api/admin/users/{id}/status
     *
     * Body: { status: active|banned, banned_reason?: string }
     *
     * Aturan:
     * - Developer tidak boleh mem-ban dirinya sendiri
     * - Developer tidak boleh mem-ban sesama developer
     * - Saat banned, hapus semua token Sanctum user
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['active', 'banned'])],
            'banned_reason' => [
                Rule::requiredIf(fn () => $request->status === 'banned'),
                'nullable',
                'string',
                'max:500',
            ],
        ]);

        /** @var User $actor */
        $actor = $request->user();
        $target = User::findOrFail($id);

        // Developer tidak boleh mem-ban dirinya sendiri
        if ($actor->id === $target->id) {
            throw ValidationException::withMessages([
                'id' => ['Anda tidak dapat mengubah status akun Anda sendiri.'],
            ]);
        }

        // Developer tidak boleh mem-ban sesama developer
        if ($target->isDeveloper() && $validated['status'] === 'banned') {
            throw ValidationException::withMessages([
                'status' => ['Tidak dapat mem-ban akun developer lain.'],
            ]);
        }

        $target->update([
            'status' => $validated['status'],
            'banned_reason' => $validated['status'] === 'banned'
                ? $validated['banned_reason']
                : null,
        ]);

        // Hapus semua token Sanctum saat akun di-ban
        if ($validated['status'] === 'banned') {
            $target->tokens()->delete();
        }

        $message = $validated['status'] === 'banned'
            ? 'Akun berhasil diblokir.'
            : 'Akun berhasil diaktifkan kembali.';

        return response()->json([
            'message' => $message,
            'data' => new UserResource($target->fresh()),
        ]);
    }
}
