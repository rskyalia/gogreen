<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Models\WasteBank;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * POST /api/register
     *
     * Membuat akun citizen. Jika payload "waste_bank" disertakan,
     * akun dibuat sebagai waste_bank dengan status is_verified=false.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request): JsonResponse {
            $role = $request->has('waste_bank') ? 'waste_bank' : 'citizen';

            $user = User::create([
                'name'     => $request->name,
                'email'    => $request->email,
                'password' => $request->password, // auto-hashed via cast
                'role'     => $role,
                'phone'    => $request->phone,
            ]);

            // Buat record waste bank jika mendaftar sebagai waste_bank
            if ($role === 'waste_bank') {
                WasteBank::create([
                    'user_id'         => $user->id,
                    'name'            => $request->input('waste_bank.name'),
                    'address'         => $request->input('waste_bank.address'),
                    'latitude'        => $request->input('waste_bank.latitude'),
                    'longitude'       => $request->input('waste_bank.longitude'),
                    'phone'           => $request->input('waste_bank.phone'),
                    'operating_hours' => $request->input('waste_bank.operating_hours'),
                    'description'     => $request->input('waste_bank.description'),
                    'is_active'       => true,
                    'is_verified'     => false, // menunggu persetujuan admin
                ]);
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            $user->load('wasteBank');

            return response()->json([
                'message' => 'Registrasi berhasil.' . ($role === 'waste_bank'
                    ? ' Akun bank sampah Anda menunggu verifikasi admin.'
                    : ''),
                'token'   => $token,
                'user'    => new UserResource($user),
            ], 201);
        });
    }

    /**
     * POST /api/login
     */
    public function login(LoginRequest $request): JsonResponse
    {
        if (! Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        /** @var User $user */
        $user = Auth::user();

        if (! $user->is_active) {
            Auth::logout();
            return response()->json([
                'message' => 'Akun Anda telah dinonaktifkan. Hubungi administrator.',
            ], 403);
        }

        // Hapus token lama (single session) — opsional, hapus baris ini
        // untuk mendukung multi-device login
        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        $user->load('wasteBank');

        return response()->json([
            'message' => 'Login berhasil.',
            'token'   => $token,
            'user'    => new UserResource($user),
        ]);
    }

    /**
     * POST /api/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout berhasil.',
        ]);
    }

    /**
     * GET /api/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('wasteBank');

        return response()->json([
            'user' => new UserResource($user),
        ]);
    }
}
